// Service worker de CyberCoach: mensajes, píldora semanal, aviso de descargas y reporte.
importScripts("../shared/storage.js", "../shared/detector-rules.js");

const TIP_ALARM = "cybercoach-weekly-tip";

chrome.runtime.onInstalled.addListener(async (details) => {
  chrome.alarms.create(TIP_ALARM, { delayInMinutes: 60 * 24, periodInMinutes: 60 * 24 * 7 });
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("course/course.html?welcome=1") });
  }
  updateBadge();
});

chrome.runtime.onStartup.addListener(updateBadge);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== TIP_ALARM) return;
  const tips = await CC.loadTips();
  const tip = tips[Math.floor(Math.random() * tips.length)];
  chrome.notifications.create("tip-" + Date.now(), {
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/icons/icon128.png"),
    title: "💡 Píldora de seguridad: " + tip.title,
    message: tip.text,
    priority: 0
  });
});

chrome.notifications.onClicked.addListener((id) => {
  if (id.startsWith("tip-")) chrome.tabs.create({ url: chrome.runtime.getURL("course/course.html") });
  chrome.notifications.clear(id);
});

// Aviso formativo ante descargas de riesgo.
chrome.downloads.onCreated.addListener(async (item) => {
  const config = await CC.getConfig();
  if (config.detectorEnabled === false) return;
  const risk = CCRules.isRiskyDownload(item.filename || item.finalUrl || item.url);
  if (!risk) return;
  const extra = risk.doubleExt ? " Además tiene DOBLE extensión, un truco típico para disfrazar malware." : "";
  chrome.notifications.create("dl-" + item.id, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/icons/icon128.png"),
    title: "⚠️ Descarga de riesgo: ." + risk.ext,
    message: `Este tipo de archivo puede ejecutar código en tu equipo.${extra} Ábrelo solo si esperabas recibirlo y viene de una fuente de confianza.`,
    priority: 1
  });
  const state = await CC.getState();
  state.warningsSeen += 1;
  await CC.saveState(state);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "getConfig":
        sendResponse(await CC.getConfig());
        break;
      case "warningShown": {
        const state = await CC.getState();
        state.warningsSeen += 1;
        await CC.saveState(state);
        sendResponse({ ok: true });
        break;
      }
      case "openCourse":
        chrome.tabs.create({
          url: chrome.runtime.getURL("course/course.html" + (msg.moduleId ? "#" + msg.moduleId : ""))
        });
        sendResponse({ ok: true });
        break;
      case "report": {
        const config = await CC.getConfig();
        const gained = await CC.recordReport(msg.url);
        chrome.tabs.create({ url: CC.buildReportMailto(config, msg.url, msg.source || "Reporte manual") });
        updateBadge();
        sendResponse({ ok: true, gained });
        break;
      }
      case "stateChanged":
        updateBadge();
        sendResponse({ ok: true });
        break;
      default:
        sendResponse({ ok: false });
    }
  })();
  return true; // Respuesta asíncrona.
});

// Muestra en el icono cuántos módulos quedan pendientes.
async function updateBadge() {
  try {
    const [modules, state] = await Promise.all([CC.loadModules(), CC.getState()]);
    const pending = modules.filter((m) => !state.progress[m.id]?.passed).length;
    chrome.action.setBadgeText({ text: pending ? String(pending) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
  } catch (_) {
    /* sin badge */
  }
}
