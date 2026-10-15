// Página de formación: inicio, lecciones, quiz, resultados y certificado.
const main = document.getElementById("main");
let MODULES = [];
let CONFIG = {};

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Formato mínimo para el contenido: **negrita** y `código`.
const fmt = (s) =>
  esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>");

function toast(text) {
  const t = document.getElementById("toast");
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), 3200);
}

async function refreshSidebar() {
  const state = await CC.getState();
  const { current, pct } = CC.levelFor(state.points);
  document.getElementById("level-icon").textContent = current.icon;
  document.getElementById("level-name").textContent = current.name;
  document.getElementById("points").textContent = state.points;
  document.getElementById("level-bar").style.width = pct + "%";

  const active = location.hash.slice(1).split("/")[0];
  const nav = document.getElementById("nav");
  nav.innerHTML =
    `<li><a href="#" class="${!active ? "active" : ""}">🏠 Inicio</a></li>` +
    MODULES.map(
      (m) => `<li><a href="#${m.id}" class="${active === m.id ? "active" : ""}">
        <span>${m.icon}</span><span>${esc(m.title)}</span>
        ${state.progress[m.id]?.passed ? '<span class="check">✔</span>' : ""}</a></li>`
    ).join("") +
    `<li><a href="#certificado" class="${active === "certificado" ? "active" : ""}">🏆 Certificado</a></li>`;
  chrome.runtime.sendMessage({ type: "stateChanged" });
}

// ---------- Vistas ----------

async function viewHome() {
  const state = await CC.getState();
  const done = MODULES.filter((m) => state.progress[m.id]?.passed).length;
  const welcome = new URLSearchParams(location.search).has("welcome");

  main.innerHTML = `
    <h1>${welcome ? "¡Bienvenido/a a CyberCoach!" : "Tu formación en ciberseguridad"}</h1>
    <p class="lead">Micro-cursos de pocos minutos para protegerte a ti y a ${esc(CONFIG.companyName)}.
      Completa cada módulo y supera el quiz con un ${CC.PASS_SCORE}% o más.</p>

    <div class="stack">
      <div class="card">
        <h2>¿Cómo te llamas?</h2>
        <p class="muted small">Aparecerá en tu certificado. Se guarda solo en este navegador.</p>
        <form class="name-form" id="name-form">
          <input id="name" maxlength="80" placeholder="Nombre y apellidos" value="${esc(state.userName)}">
          <button class="btn" type="submit">Guardar</button>
        </form>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h2 style="margin:0">Itinerario</h2>
          <span class="pill">${done}/${MODULES.length} completados</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${Math.round((done / MODULES.length) * 100)}%"></div></div>
      </div>

      <div class="grid">
        ${MODULES.map((m) => {
          const p = state.progress[m.id];
          return `<div class="card mod-card" data-id="${m.id}" tabindex="0" role="link">
            <span class="ico">${m.icon}</span>
            <strong>${esc(m.title)}</strong>
            <span class="muted small">${esc(m.summary)}</span>
            <div class="meta"><span>⏱ ${m.minutes} min</span>
              ${p?.passed ? `<span class="done">✔ ${p.bestScore}%</span>` : "<span>Pendiente</span>"}</div>
          </div>`;
        }).join("")}
      </div>

      <div class="card">
        <h2>Insignias</h2>
        <div class="badges">
          ${Object.entries(CC.BADGES).map(([id, b]) =>
            `<span class="badge ${state.badges.includes(id) ? "" : "locked"}" title="${esc(b.desc)}">${b.icon} ${esc(b.name)}</span>`
          ).join("")}
        </div>
      </div>
    </div>`;

  main.querySelectorAll(".mod-card").forEach((el) => {
    const go = () => (location.hash = el.dataset.id);
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => e.key === "Enter" && go());
  });
  document.getElementById("name-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const s = await CC.getState();
    s.userName = document.getElementById("name").value.trim();
    await CC.saveState(s);
    toast("Nombre guardado ✔");
  });
}

function viewLesson(mod, idx) {
  const lesson = mod.lessons[idx];
  const total = mod.lessons.length + 1; // +1 = quiz
  main.innerHTML = `
    <p class="muted small">${mod.icon} ${esc(mod.title)} · Lección ${idx + 1} de ${mod.lessons.length}</p>
    <div class="stepper">${Array.from({ length: total }, (_, i) => `<span class="${i <= idx ? "on" : ""}"></span>`).join("")}</div>
    <article class="card lesson">
      <h2>${esc(lesson.title)}</h2>
      ${(lesson.text || []).map((p) => `<p>${fmt(p)}</p>`).join("")}
      ${lesson.bullets ? `<ul>${lesson.bullets.map((b) => `<li>${fmt(b)}</li>`).join("")}</ul>` : ""}
      ${lesson.example ? `<div class="example"><b>${esc(lesson.example.label)}</b><pre>${esc(lesson.example.content)}</pre></div>` : ""}
    </article>
    <div class="actions">
      <button class="btn ghost" id="prev">${idx === 0 ? "← Inicio" : "← Anterior"}</button>
      <button class="btn" id="next">${idx === mod.lessons.length - 1 ? "Ir al quiz →" : "Siguiente →"}</button>
    </div>`;

  document.getElementById("prev").onclick = () =>
    (location.hash = idx === 0 ? "" : `${mod.id}/${idx - 1}`);
  document.getElementById("next").onclick = async () => {
    if (idx === mod.lessons.length - 1) {
      await completeLessons(mod);
      location.hash = `${mod.id}/quiz`;
    } else {
      location.hash = `${mod.id}/${idx + 1}`;
    }
  };
}

async function completeLessons(mod) {
  const state = await CC.getState();
  const p = state.progress[mod.id] || {};
  if (!p.lessonsDone) {
    p.lessonsDone = true;
    const gained = mod.lessons.length * CC.POINTS.lesson;
    state.points += gained;
    toast(`+${gained} puntos por completar las lecciones`);
  }
  state.progress[mod.id] = p;
  CC.touchStreak(state);
  await CC.saveState(state);
  refreshSidebar();
}

function viewQuiz(mod) {
  const answers = [];
  let i = 0;

  const renderQ = () => {
    const q = mod.quiz[i];
    main.innerHTML = `
      <p class="muted small">${mod.icon} ${esc(mod.title)} · Pregunta ${i + 1} de ${mod.quiz.length}</p>
      <div class="stepper">${mod.quiz.map((_, k) => `<span class="${k <= i ? "on" : ""}"></span>`).join("")}</div>
      <div class="card">
        <div class="q-title">${fmt(q.q)}</div>
        <div class="options">
          ${q.options.map((o, k) => `<button class="option" data-k="${k}">${fmt(o)}</button>`).join("")}
        </div>
        <div id="feedback"></div>
      </div>
      <div class="actions"><span></span><button class="btn" id="next" hidden>${i === mod.quiz.length - 1 ? "Ver resultado →" : "Siguiente →"}</button></div>`;

    main.querySelectorAll(".option").forEach((btn) => {
      btn.onclick = () => {
        const k = Number(btn.dataset.k);
        const ok = k === q.answer;
        answers[i] = ok;
        main.querySelectorAll(".option").forEach((b) => {
          b.disabled = true;
          if (Number(b.dataset.k) === q.answer) b.classList.add("correct");
        });
        if (!ok) btn.classList.add("wrong");
        document.getElementById("feedback").innerHTML =
          `<div class="feedback"><strong>${ok ? "✅ ¡Correcto!" : "❌ No exactamente."}</strong> ${fmt(q.explain)}</div>`;
        const next = document.getElementById("next");
        next.hidden = false;
        next.focus();
      };
    });
    document.getElementById("next").onclick = () => {
      if (i < mod.quiz.length - 1) {
        i++;
        renderQ();
      } else {
        finishQuiz(mod, answers);
      }
    };
  };
  renderQ();
}

async function finishQuiz(mod, answers) {
  const correct = answers.filter(Boolean).length;
  const score = Math.round((correct / mod.quiz.length) * 100);
  const passed = score >= CC.PASS_SCORE;

  const state = await CC.getState();
  const p = state.progress[mod.id] || {};
  let gained = 0;
  // Solo se suman puntos por mejorar la mejor marca (evita "farmear" puntos repitiendo).
  const prevCorrect = p.bestCorrect || 0;
  if (correct > prevCorrect) {
    gained += (correct - prevCorrect) * CC.POINTS.correctAnswer;
    p.bestCorrect = correct;
  }
  p.bestScore = Math.max(p.bestScore || 0, score);
  const newBadges = [];
  if (passed && !p.passed) {
    p.passed = true;
    p.completedAt = new Date().toISOString();
    gained += CC.POINTS.modulePassed;
    if (CC.award(state, "first_module")) newBadges.push("first_module");
  }
  if (score === 100 && CC.award(state, "perfect_quiz")) newBadges.push("perfect_quiz");
  state.progress[mod.id] = p;
  if (MODULES.every((m) => state.progress[m.id]?.passed) && CC.award(state, "all_modules")) newBadges.push("all_modules");
  state.points += gained;
  CC.touchStreak(state);
  await CC.saveState(state);
  refreshSidebar();

  const nextMod = MODULES.find((m) => !state.progress[m.id]?.passed);
  main.innerHTML = `
    <div class="card result">
      <div class="big">${passed ? "🎉" : "💪"}</div>
      <h2>${passed ? "¡Módulo superado!" : "Casi lo tienes"}</h2>
      <div class="score">${score}%</div>
      <p class="muted">${correct} de ${mod.quiz.length} respuestas correctas · ${gained ? `+${gained} puntos` : "sin puntos nuevos"}</p>
      ${!passed ? `<p>Necesitas un ${CC.PASS_SCORE}% para superarlo. Repasa las lecciones y vuelve a intentarlo.</p>` : ""}
      ${newBadges.map((b) => `<p class="badge" style="display:inline-flex">${CC.BADGES[b].icon} Nueva insignia: ${esc(CC.BADGES[b].name)}</p>`).join(" ")}
      ${mod.takeaway ? `<div class="example" style="text-align:left;margin-top:16px"><b>📌 Para recordar</b>${fmt(mod.takeaway)}</div>` : ""}
    </div>
    <div class="actions">
      <button class="btn ghost" id="retry">${passed ? "Repasar módulo" : "Repetir lecciones"}</button>
      ${nextMod ? `<button class="btn" id="go-next">Siguiente: ${esc(nextMod.title)} →</button>`
                : `<button class="btn" id="go-cert">🏆 Ver mi certificado</button>`}
    </div>`;
  document.getElementById("retry").onclick = () => (location.hash = `${mod.id}/0`);
  const gn = document.getElementById("go-next");
  if (gn) gn.onclick = () => (location.hash = nextMod.id);
  const gc = document.getElementById("go-cert");
  if (gc) gc.onclick = () => (location.hash = "certificado");
}

async function viewCertificate() {
  const state = await CC.getState();
  const pending = MODULES.filter((m) => !state.progress[m.id]?.passed);
  if (pending.length) {
    main.innerHTML = `
      <h1>Certificado</h1>
      <p class="lead">Completa todos los módulos para obtener tu certificado.</p>
      <div class="card"><h2>Te faltan:</h2><ul>${pending.map((m) => `<li><a href="#${m.id}">${m.icon} ${esc(m.title)}</a></li>`).join("")}</ul></div>`;
    return;
  }
  const last = MODULES.map((m) => state.progress[m.id].completedAt).sort().pop();
  const avg = Math.round(MODULES.reduce((a, m) => a + state.progress[m.id].bestScore, 0) / MODULES.length);
  main.innerHTML = `
    <div class="cert">
      <div style="font-size:48px">🏆</div>
      <p class="muted">${esc(CONFIG.companyName)} certifica que</p>
      <div class="who">${esc(state.userName || "(escribe tu nombre en Inicio)")}</div>
      <p>ha completado el itinerario de</p>
      <h1>Concienciación en Ciberseguridad</h1>
      <p class="muted">${MODULES.length} módulos · nota media ${avg}% · ${new Date(last).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
      <p class="small muted">${MODULES.map((m) => esc(m.title)).join(" · ")}</p>
    </div>
    <div class="actions"><span></span><button class="btn" id="print">🖨️ Imprimir / Guardar PDF</button></div>`;
  document.getElementById("print").onclick = () => window.print();
}

// ---------- Router ----------

async function route() {
  const [id, step] = location.hash.slice(1).split("/");
  await refreshSidebar();
  main.focus();
  window.scrollTo(0, 0);
  if (!id) return viewHome();
  if (id === "certificado") return viewCertificate();
  const mod = MODULES.find((m) => m.id === id);
  if (!mod) return viewHome();
  if (step === "quiz") return viewQuiz(mod);
  const idx = Math.min(Math.max(Number(step) || 0, 0), mod.lessons.length - 1);
  viewLesson(mod, idx);
}

(async () => {
  [MODULES, CONFIG] = await Promise.all([CC.loadModules(), CC.getConfig()]);
  window.addEventListener("hashchange", route);
  route();
})();
