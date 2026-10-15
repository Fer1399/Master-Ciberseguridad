const $ = (id) => document.getElementById(id);

async function render() {
  const [config, state, modules] = await Promise.all([CC.getConfig(), CC.getState(), CC.loadModules()]);

  $("company").textContent = config.companyName;

  const { current, next, pct } = CC.levelFor(state.points);
  $("level-icon").textContent = current.icon;
  $("level-name").textContent = current.name;
  $("points").textContent = state.points;
  $("next").textContent = next ? `${next.min - state.points} para ${next.name}` : "Nivel máximo";
  $("level-bar").style.width = pct + "%";
  $("streak").textContent = state.streak.count;

  const done = modules.filter((m) => state.progress[m.id]?.passed).length;
  $("overall").textContent = `${done}/${modules.length}`;

  const list = $("modules");
  list.replaceChildren(
    ...modules.map((m) => {
      const p = state.progress[m.id];
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="ico">${m.icon}</span>
        <span class="grow">${m.title}</span>
        <span class="state ${p?.passed ? "done" : "todo"}">${p?.passed ? "✔ " + p.bestScore + "%" : m.minutes + " min"}</span>`;
      li.onclick = () => openCourse(m.id);
      return li;
    })
  );

  $("badges").replaceChildren(
    ...Object.entries(CC.BADGES).map(([id, b]) => {
      const el = document.createElement("span");
      el.className = "badge" + (state.badges.includes(id) ? "" : " locked");
      el.title = b.desc;
      el.textContent = `${b.icon} ${b.name}`;
      return el;
    })
  );
}

function openCourse(moduleId) {
  chrome.tabs.create({ url: chrome.runtime.getURL("course/course.html" + (moduleId ? "#" + moduleId : "")) });
  window.close();
}

$("open-course").onclick = (e) => { e.preventDefault(); openCourse(); };
$("open-options").onclick = (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); };

$("report").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || "";
  const msg = $("report-msg");
  msg.hidden = false;
  if (!/^https?:/.test(url)) {
    msg.textContent = "Abre la página sospechosa y vuelve a pulsar el botón.";
    return;
  }
  const res = await chrome.runtime.sendMessage({ type: "report", url, source: "Reporte manual del empleado" });
  msg.textContent = res?.gained ? `¡Gracias! +${res.gained} puntos. Se ha abierto el email para seguridad.` : "Reporte preparado. ¡Gracias por avisar!";
  render();
};

render();
