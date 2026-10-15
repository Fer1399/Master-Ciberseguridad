// Content script: avisos contextuales en la página. Todo el análisis es local.
(() => {
  if (window.top !== window) return; // Solo en el marco principal.

  const SHOWN_KEY = "__cybercoach_banner_shown__";
  let shown = false;

  function hasPasswordField() {
    return !!document.querySelector('input[type="password"]');
  }

  function getConfig() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "getConfig" }, (cfg) => {
        if (chrome.runtime.lastError) return resolve(null);
        resolve(cfg);
      });
    });
  }

  function evaluate(config) {
    const host = location.hostname;
    const findings = CCRules.analyzeHostname(host, config.corporateDomains || []);
    const loginForm = hasPasswordField();

    // Avisos siempre relevantes: imitación del dominio corporativo y punycode.
    // Avisos que solo mostramos con formulario de login: marcas e IPs (menos ruido).
    const relevant = findings.filter(
      (f) => f.type === "corporate-lookalike" || f.type === "punycode" || loginForm
    );

    if (loginForm && location.protocol === "http:") {
      relevant.push({
        type: "no-https",
        message: "Esta página pide una contraseña sin conexión cifrada (HTTP). Cualquiera en la red podría verla."
      });
    }
    return relevant;
  }

  function showBanner(findings, config) {
    if (shown || sessionStorage.getItem(SHOWN_KEY + location.hostname)) return;
    shown = true;
    chrome.runtime.sendMessage({ type: "warningShown", findings: findings.map((f) => f.type) });

    const host = document.createElement("div");
    host.style.cssText = "all:initial;position:fixed;top:0;left:0;right:0;z-index:2147483647;";
    const root = host.attachShadow({ mode: "closed" });
    const items = findings.map((f) => `<li>${escapeHtml(f.message)}</li>`).join("");
    root.innerHTML = `
      <style>
        .bar{font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#fff7ed;color:#431407;
             border-bottom:3px solid #ea580c;box-shadow:0 4px 16px rgba(0,0,0,.18);padding:14px 18px;display:flex;gap:14px;align-items:flex-start}
        .ico{font-size:26px;line-height:1}
        .txt{flex:1;min-width:0}
        h2{margin:0 0 4px;font-size:15px}
        ul{margin:4px 0 6px;padding-left:18px}
        .tip{color:#7c2d12;font-size:13px}
        .btns{display:flex;gap:8px;flex-wrap:wrap}
        button{font:600 13px system-ui,sans-serif;border-radius:8px;padding:8px 12px;cursor:pointer;border:1px solid #c2410c}
        .primary{background:#c2410c;color:#fff}
        .ghost{background:#fff;color:#7c2d12}
        @media (max-width:640px){.bar{flex-direction:column}}
      </style>
      <div class="bar" role="alert">
        <div class="ico">⚠️</div>
        <div class="txt">
          <h2>CyberCoach: revisa esta página antes de introducir datos</h2>
          <ul>${items}</ul>
          <div class="tip">💡 Comprueba la dirección completa en la barra del navegador. Ante la duda, entra escribiendo tú la dirección oficial o pregunta a seguridad.</div>
        </div>
        <div class="btns">
          <button class="primary" id="report">Reportar a seguridad</button>
          <button class="ghost" id="learn">¿Por qué este aviso?</button>
          <button class="ghost" id="close">Entendido</button>
        </div>
      </div>`;

    root.getElementById("close").onclick = () => {
      sessionStorage.setItem(SHOWN_KEY + location.hostname, "1");
      host.remove();
    };
    root.getElementById("learn").onclick = () =>
      chrome.runtime.sendMessage({ type: "openCourse", moduleId: "navegacion-segura" });
    root.getElementById("report").onclick = () => {
      chrome.runtime.sendMessage({ type: "report", url: location.href, source: "Aviso automático de CyberCoach" });
      root.getElementById("report").textContent = "✔ Reporte preparado";
    };

    document.documentElement.appendChild(host);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function run() {
    const config = await getConfig();
    if (!config || config.detectorEnabled === false) return;

    const check = () => {
      const findings = evaluate(config);
      if (findings.length) showBanner(findings, config);
    };
    check();

    // Formularios de login que aparecen más tarde (SPA, modales).
    if (!shown) {
      const obs = new MutationObserver(() => {
        if (shown) return obs.disconnect();
        if (hasPasswordField()) check();
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => obs.disconnect(), 30000);
    }
  }

  run();
})();
