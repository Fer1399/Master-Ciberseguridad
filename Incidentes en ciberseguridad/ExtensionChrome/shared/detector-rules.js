// Reglas de detección de riesgo. Funciones puras: todo se evalúa en local,
// no se envía ni se guarda el historial de navegación.

const CCRules = (() => {
  // Marcas que se suplantan con frecuencia en campañas de phishing.
  const IMPERSONATED_BRANDS = {
    microsoft: ["microsoft.com", "live.com", "office.com", "microsoftonline.com", "outlook.com", "sharepoint.com"],
    office365: ["office.com", "microsoftonline.com"],
    outlook: ["outlook.com", "live.com", "office.com"],
    google: ["google.com", "google.es", "gmail.com", "youtube.com"],
    gmail: ["gmail.com", "google.com"],
    apple: ["apple.com", "icloud.com"],
    icloud: ["icloud.com", "apple.com"],
    paypal: ["paypal.com", "paypal.es"],
    amazon: ["amazon.com", "amazon.es"],
    netflix: ["netflix.com"],
    linkedin: ["linkedin.com"],
    facebook: ["facebook.com"],
    instagram: ["instagram.com"],
    dropbox: ["dropbox.com"],
    docusign: ["docusign.com", "docusign.net"],
    santander: ["santander.com", "bancosantander.es"],
    bbva: ["bbva.es", "bbva.com"],
    caixabank: ["caixabank.es", "caixabank.com"],
    correos: ["correos.es"],
    agenciatributaria: ["agenciatributaria.es", "agenciatributaria.gob.es"],
    dhl: ["dhl.com", "dhl.es"]
  };

  // Dominios legítimos que contienen nombres de marca (evita falsos positivos).
  const KNOWN_GOOD = [
    "amazonaws.com", "cloudfront.net", "googleapis.com", "googleusercontent.com", "gstatic.com",
    "googlevideo.com", "microsoftstore.com", "windows.net", "azure.com", "office.net",
    "applecontent.com", "apple-cloudkit.com", "fbcdn.net", "linkedin.cn", "github.com"
  ];

  // Sufijos de dos niveles habituales (aproximación sin lista PSL completa).
  const TWO_LEVEL_SUFFIXES = new Set([
    "co.uk", "com.es", "org.es", "gob.es", "nom.es", "edu.es",
    "com.mx", "gob.mx", "com.ar", "gob.ar", "com.co", "gov.co",
    "com.pe", "gob.pe", "com.br", "gov.br", "com.au", "co.jp"
  ]);

  const RISKY_DOWNLOAD_EXT = [
    "exe", "msi", "bat", "cmd", "com", "scr", "pif", "ps1", "vbs", "vbe", "js", "jse",
    "wsf", "hta", "jar", "lnk", "iso", "img", "docm", "xlsm", "pptm", "dotm", "xlam", "reg"
  ];

  function registrableDomain(hostname) {
    const parts = hostname.toLowerCase().replace(/\.$/, "").split(".");
    if (parts.length <= 2) return parts.join(".");
    const lastTwo = parts.slice(-2).join(".");
    if (TWO_LEVEL_SUFFIXES.has(lastTwo)) return parts.slice(-3).join(".");
    return lastTwo;
  }

  function stripTld(domain) {
    const reg = registrableDomain(domain);
    const parts = reg.split(".");
    const lastTwo = parts.slice(-2).join(".");
    const suffixLen = TWO_LEVEL_SUFFIXES.has(lastTwo) ? 2 : 1;
    return parts.slice(0, parts.length - suffixLen).join(".");
  }

  // Normaliza trucos visuales típicos: 0→o, 1→l, rn→m, guiones...
  function normalize(label) {
    return label
      .toLowerCase()
      .replace(/rn/g, "m")
      .replace(/vv/g, "w")
      .replace(/0/g, "o")
      .replace(/[1!|]/g, "l")
      .replace(/3/g, "e")
      .replace(/4/g, "a")
      .replace(/5/g, "s")
      .replace(/7/g, "t")
      .replace(/[-_]/g, "");
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  function isSameOrSubdomain(hostname, domain) {
    const h = hostname.toLowerCase();
    const d = domain.toLowerCase().replace(/^\*?\./, "");
    return h === d || h.endsWith("." + d);
  }

  /**
   * Analiza un hostname y devuelve una lista de hallazgos.
   * @param {string} hostname
   * @param {string[]} corporateDomains dominios legítimos de la empresa
   * @returns {{type:string, target:string, message:string}[]}
   */
  function analyzeHostname(hostname, corporateDomains = []) {
    const findings = [];
    if (!hostname) return findings;
    const host = hostname.toLowerCase();

    // 1) Punycode / homógrafos (ej. xn--micrsoft-...).
    if (host.split(".").some((l) => l.startsWith("xn--"))) {
      findings.push({
        type: "punycode",
        target: host,
        message: "El dominio usa caracteres especiales (punycode) que pueden imitar letras normales."
      });
    }

    // 2) Imitación de dominios corporativos.
    const reg = registrableDomain(host);
    const regBase = normalize(stripTld(host));
    for (const corp of corporateDomains) {
      if (!corp) continue;
      if (isSameOrSubdomain(host, corp)) return findings; // Dominio legítimo de la empresa.
      const corpBase = normalize(stripTld(corp));
      if (corpBase.length < 4) continue;
      const dist = levenshtein(regBase, corpBase);
      const embeds = host.replace(/[-.]/g, "").includes(corpBase) && reg !== registrableDomain(corp);
      if ((dist > 0 && dist <= 2) || regBase === corpBase || embeds) {
        findings.push({
          type: "corporate-lookalike",
          target: corp,
          message: `Este dominio (${reg}) se parece al de tu empresa (${corp}) pero NO es el oficial.`
        });
        break;
      }
    }

    // 3) Imitación de marcas conocidas.
    if (KNOWN_GOOD.some((d) => isSameOrSubdomain(host, d))) return findings;
    for (const legit of Object.values(IMPERSONATED_BRANDS)) {
      if (legit.some((d) => isSameOrSubdomain(host, d))) return findings;
    }
    // Se comparan las etiquetas tal cual y normalizadas (office365 no debe convertirse en "officee6s").
    const rawLabels = host.split(".").map((l) => l.replace(/[-_]/g, ""));
    const labels = [...rawLabels, ...host.split(".").map(normalize)];
    for (const [brand, legit] of Object.entries(IMPERSONATED_BRANDS)) {
      const hit =
        labels.some((l) => l === brand || (l.includes(brand) && l.length > brand.length)) ||
        (brand.length >= 5 && levenshtein(regBase, brand) > 0 && levenshtein(regBase, brand) <= 1);
      if (hit) {
        findings.push({
          type: "brand-lookalike",
          target: brand,
          message: `La dirección menciona o imita a "${brand}", pero no es un dominio oficial (${legit[0]}).`
        });
        break;
      }
    }

    // 4) IP directa en lugar de dominio.
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      findings.push({
        type: "ip-address",
        target: host,
        message: "Estás en una dirección IP, no en un dominio. Las webs legítimas casi nunca piden datos así."
      });
    }

    return findings;
  }

  function isRiskyDownload(filename) {
    const name = (filename || "").toLowerCase().split(/[\\/]/).pop();
    const parts = name.split(".");
    if (parts.length < 2) return null;
    const ext = parts.pop();
    const doubleExt = parts.length >= 2 && ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "png", "txt"].includes(parts[parts.length - 1]);
    if (RISKY_DOWNLOAD_EXT.includes(ext)) {
      return { ext, doubleExt, name };
    }
    return null;
  }

  return { analyzeHostname, isRiskyDownload, registrableDomain, normalize, levenshtein };
})();

if (typeof self !== "undefined") self.CCRules = CCRules;
if (typeof module !== "undefined") module.exports = CCRules;
