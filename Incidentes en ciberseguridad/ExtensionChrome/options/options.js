const FIELDS = ["companyName", "corporateDomains", "reportEmail", "detectorEnabled"];
const $ = (id) => document.getElementById(id);

async function load() {
  const cfg = await CC.getConfig();
  $("companyName").value = cfg.companyName;
  $("corporateDomains").value = (cfg.corporateDomains || []).join("\n");
  $("reportEmail").value = cfg.reportEmail;
  $("detectorEnabled").checked = cfg.detectorEnabled !== false;

  const locked = cfg.lockSettings ? FIELDS : cfg.managedKeys;
  if (locked.length) {
    $("lock").hidden = false;
    locked.forEach((k) => $(k) && ($(k).disabled = true));
  }
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await CC.saveConfig({
    companyName: $("companyName").value.trim() || "Mi Empresa",
    corporateDomains: $("corporateDomains").value
      .split(/[\s,;]+/)
      .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      .filter(Boolean),
    reportEmail: $("reportEmail").value.trim(),
    detectorEnabled: $("detectorEnabled").checked
  });
  $("saved").hidden = false;
  setTimeout(() => ($("saved").hidden = true), 2000);
});

$("export").onclick = async () => {
  const state = await CC.getState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cybercoach-progreso.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

$("reset").onclick = async () => {
  if (!confirm("¿Seguro? Se borrarán tus puntos, insignias y progreso.")) return;
  await chrome.storage.local.remove("state");
  chrome.runtime.sendMessage({ type: "stateChanged" });
  alert("Progreso reiniciado.");
};

load();
