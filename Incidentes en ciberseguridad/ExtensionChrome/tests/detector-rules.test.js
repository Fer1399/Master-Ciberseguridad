// Ejecutar con: node --test tests/
const test = require("node:test");
const assert = require("node:assert");
const R = require("../shared/detector-rules.js");

const corp = ["miempresa.com"];
const types = (h, c = corp) => R.analyzeHostname(h, c).map((f) => f.type);

test("dominios legítimos no generan avisos", () => {
  for (const h of ["miempresa.com", "intranet.miempresa.com", "login.microsoftonline.com", "mail.google.com",
                   "www.paypal.com", "s3.amazonaws.com", "github.com", "www.elpais.com", "www.bbva.es"]) {
    assert.deepStrictEqual(types(h), [], h);
  }
});

test("imitaciones del dominio corporativo", () => {
  for (const h of ["miempresa-login.com", "rniempresa.com", "m1empresa.com", "miempresa.com.verify.net", "miempresa.co", "miernpresa.com"]) {
    assert.ok(types(h).includes("corporate-lookalike"), h);
  }
});

test("imitaciones de marcas", () => {
  for (const h of ["micr0soft.com", "paypal-secure.net", "login.microsoft.com.evil.io", "office365-verify.com", "amaz0n.es"]) {
    assert.ok(types(h).includes("brand-lookalike"), h);
  }
});

test("punycode e IP", () => {
  assert.ok(types("xn--pypal-4ve.com").includes("punycode"));
  assert.ok(types("192.168.1.10").includes("ip-address"));
});

test("descargas de riesgo", () => {
  assert.strictEqual(R.isRiskyDownload("C:\\Users\\a\\Downloads\\informe.pdf"), null);
  assert.strictEqual(R.isRiskyDownload("setup.exe").ext, "exe");
  assert.strictEqual(R.isRiskyDownload("factura.pdf.exe").doubleExt, true);
  assert.strictEqual(R.isRiskyDownload("macro.xlsm").ext, "xlsm");
});
