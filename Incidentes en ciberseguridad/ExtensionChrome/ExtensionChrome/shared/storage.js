// Estado compartido de CyberCoach: progreso, puntos, insignias y configuración.
// Se carga en popup, curso, opciones y service worker (importScripts).

const CC = (() => {
  const DEFAULT_CONFIG = {
    companyName: "Mi Empresa",
    corporateDomains: [],
    reportEmail: "seguridad@miempresa.com",
    detectorEnabled: true,
    lockSettings: false
  };

  const DEFAULT_STATE = {
    userName: "",
    points: 0,
    progress: {}, // { [moduleId]: { lessonsDone: bool, bestScore: 0-100, passed: bool, completedAt } }
    badges: [], // ids de insignias
    reported: [], // { url, at }
    warningsSeen: 0,
    streak: { count: 0, lastDay: null }
  };

  const LEVELS = [
    { min: 0, name: "Novato", icon: "🌱" },
    { min: 100, name: "Aprendiz", icon: "📘" },
    { min: 250, name: "Defensor", icon: "🛡️" },
    { min: 450, name: "Guardián", icon: "🏰" },
    { min: 750, name: "Experto", icon: "🦉" }
  ];

  const BADGES = {
    first_module: { name: "Primer paso", icon: "🎯", desc: "Completa tu primer módulo" },
    perfect_quiz: { name: "Sin fallos", icon: "💯", desc: "Saca un 100% en un quiz" },
    reporter: { name: "Ojo de halcón", icon: "🦅", desc: "Reporta tu primer intento de phishing" },
    streak_5: { name: "Constancia", icon: "🔥", desc: "Aprende 5 días seguidos" },
    all_modules: { name: "Guardián certificado", icon: "🏆", desc: "Completa todo el itinerario" }
  };

  const POINTS = { lesson: 10, correctAnswer: 10, modulePassed: 30, report: 15 };
  const PASS_SCORE = 80;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  async function getConfig() {
    const { config = {} } = await chrome.storage.sync.get("config");
    let managed = {};
    try {
      managed = (await chrome.storage.managed.get(null)) || {};
    } catch (_) {
      // Sin política gestionada (instalación manual).
    }
    // La política de empresa tiene prioridad sobre la configuración local.
    return { ...DEFAULT_CONFIG, ...config, ...managed, managedKeys: Object.keys(managed) };
  }

  async function saveConfig(partial) {
    const { config = {} } = await chrome.storage.sync.get("config");
    await chrome.storage.sync.set({ config: { ...config, ...partial } });
  }

  async function getState() {
    const { state } = await chrome.storage.local.get("state");
    return { ...DEFAULT_STATE, ...(state || {}) };
  }

  async function saveState(state) {
    await chrome.storage.local.set({ state });
  }

  function levelFor(points) {
    let current = LEVELS[0];
    let next = null;
    for (let i = 0; i < LEVELS.length; i++) {
      if (points >= LEVELS[i].min) {
        current = LEVELS[i];
        next = LEVELS[i + 1] || null;
      }
    }
    const pct = next ? Math.round(((points - current.min) / (next.min - current.min)) * 100) : 100;
    return { current, next, pct };
  }

  function touchStreak(state) {
    const t = today();
    if (state.streak.lastDay === t) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    state.streak = {
      count: state.streak.lastDay === yesterday ? state.streak.count + 1 : 1,
      lastDay: t
    };
    if (state.streak.count >= 5) award(state, "streak_5");
  }

  function award(state, badgeId) {
    if (!state.badges.includes(badgeId)) {
      state.badges.push(badgeId);
      return true;
    }
    return false;
  }

  async function loadModules() {
    const res = await fetch(chrome.runtime.getURL("data/modules.json"));
    return res.json();
  }

  async function loadTips() {
    const res = await fetch(chrome.runtime.getURL("data/tips.json"));
    return res.json();
  }

  async function recordReport(url) {
    const state = await getState();
    let gained = 0;
    if (!state.reported.some((r) => r.url === url)) {
      state.reported.push({ url, at: new Date().toISOString() });
      state.points += POINTS.report;
      gained = POINTS.report;
    }
    award(state, "reporter");
    touchStreak(state);
    await saveState(state);
    return gained;
  }

  function buildReportMailto(config, url, source) {
    const subject = `[Posible phishing] ${url}`;
    const body =
      `Hola equipo de seguridad,\n\n` +
      `Quiero reportar una web o mensaje sospechoso.\n\n` +
      `URL: ${url}\n` +
      `Detectado: ${source}\n` +
      `Fecha: ${new Date().toLocaleString("es-ES")}\n\n` +
      `Comentarios:\n`;
    return `mailto:${encodeURIComponent(config.reportEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return {
    LEVELS, BADGES, POINTS, PASS_SCORE,
    getConfig, saveConfig, getState, saveState,
    levelFor, touchStreak, award, loadModules, loadTips,
    recordReport, buildReportMailto
  };
})();

if (typeof self !== "undefined") self.CC = CC;
