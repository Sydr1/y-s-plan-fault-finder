(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let st = { plan: null, hist: [] };

  function showToast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { el.hidden = true; }, 1800);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- Theme ----------
  function applyTheme() {
    const t = Store.getTheme();
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }
  function initThemeToggle() {
    applyTheme();
    $("#theme-toggle").addEventListener("click", () => {
      const current = Store.getTheme();
      const next = current === "auto" ? "dark" : current === "dark" ? "light" : "auto";
      Store.setTheme(next);
      applyTheme();
      showToast("Theme: " + next);
    });
  }

  // ---------- Bottom tab switching ----------
  function switchTab(tab) {
    $$(".tab-panel").forEach((p) => { p.hidden = p.dataset.tab !== tab; });
    $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    window.scrollTo(0, 0);
  }
  function initTabbar() {
    $$(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        switchTab(btn.dataset.tab);
        if (btn.dataset.tab === "notes") renderNotes();
      });
    });
  }

  // ---------- Decision tree ----------
  function resolveId(id) {
    if (id && id.endsWith("*")) return id.slice(0, -1) + st.plan;
    return id;
  }

  function goTo(nextId, plan) {
    if (plan) st.plan = plan;
    const resolved = resolveId(nextId);
    if (!resolved) return;
    st.hist.push(resolved);
    renderTree();
  }
  function goBack() {
    if (st.hist.length > 1) { st.hist.pop(); renderTree(); }
  }
  function restartTree() {
    st = { plan: null, hist: ["start"] };
    renderTree();
  }

  function renderTree() {
    const id = st.hist[st.hist.length - 1];
    const stage = $("#stage");
    const planLabel = st.plan ? (st.plan === "y" ? "Y plan" : "S plan") : "System not set";

    if (RESULTS[id]) {
      const [sev, title, body] = RESULTS[id];
      const badgeClass = "b-" + sev;
      const badgeLabel = sev === "ok" ? "Likely cause" : sev === "warn" ? "Check this" : "Fault found";
      stage.innerHTML = `
        <div class="card r">
          <div class="crumb">${escapeHtml(planLabel)} · Result</div>
          <span class="badge ${badgeClass}">${badgeLabel}</span>
          <p class="result-title">${escapeHtml(title)}</p>
          <p>${body}</p>
        </div>
        <div class="nav-row">
          <button id="tree-back">← Back</button>
          <button id="tree-restart">Start over</button>
        </div>
        <button class="btn btn-secondary opt-add-note" id="add-note-for-result">Add job note for this result</button>
      `;
      $("#tree-back").addEventListener("click", goBack);
      $("#tree-restart").addEventListener("click", restartTree);
      $("#add-note-for-result").addEventListener("click", () => {
        switchTab("notes");
        $("#note-job").value = `${planLabel} — ${title}`;
        $("#note-text").focus();
      });
      return;
    }

    const node = TREE[id];
    if (!node) { restartTree(); return; }

    stage.innerHTML = `
      <div class="card">
        <div class="crumb">${escapeHtml(planLabel)} · Step ${st.hist.length}</div>
        <p class="q">${escapeHtml(node.q)}</p>
        <div class="h">${node.h}</div>
        ${node.o.map((o, i) => `<button class="opt" data-i="${i}">${escapeHtml(o[0])}</button>`).join("")}
      </div>
      <div class="nav-row">
        ${st.hist.length > 1 ? '<button id="tree-back">← Back</button><button id="tree-restart">Start over</button>' : ""}
      </div>
    `;
    if (st.hist.length > 1) {
      $("#tree-back").addEventListener("click", goBack);
      $("#tree-restart").addEventListener("click", restartTree);
    }
    $$(".opt", stage).forEach((btn) => {
      btn.addEventListener("click", () => {
        const o = node.o[Number(btn.dataset.i)];
        goTo(o[1], o[2]);
      });
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Wiring reference tab ----------
  function renderWiring() {
    const wrap = $("#wiring-content");
    const sections = WIRING_REFERENCE.map((sec) => `
      <div class="card diagram-card">
        ${sec.diagram}
        <div class="diagram-caption">${escapeHtml(sec.caption)}</div>
      </div>
      <div class="card">
        <h2>${escapeHtml(sec.title)}</h2>
        <div class="sc">
          <table>
            <tr><th>Wire</th><th>Function</th></tr>
            ${sec.rows.map((r) => `
              <tr>
                <td><span class="dot" style="background:${r.dot}"></span>${escapeHtml(r.wire)}</td>
                <td>${r.fn}</td>
              </tr>
            `).join("")}
          </table>
        </div>
        <p class="h" style="margin-top:8px">${sec.note}</p>
      </div>
    `).join("");

    const spotting = `
      <div class="card">
        <h2>Y plan vs S plan: spotting them</h2>
        <ul class="h">${SPOTTING_NOTES.map((n) => `<li>${n}</li>`).join("")}</ul>
      </div>
    `;

    wrap.innerHTML = sections + spotting;
  }

  // ---------- Test tips tab ----------
  function renderTips() {
    const wrap = $("#tips-content");
    wrap.innerHTML = `
      <div class="card">
        <h2>Reading the system quickly</h2>
        <ul class="h">
          ${TEST_TIPS.map((t) => `<li><b>${escapeHtml(t.title)}:</b> ${t.text}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  // ---------- Notes tab ----------
  function renderNotes() {
    const notes = Store.getNotes();
    const list = $("#notes-list");
    $("#notes-empty").hidden = notes.length !== 0;
    list.innerHTML = notes.map((n) => `
      <li class="note-item" data-id="${n.id}">
        <div class="note-meta">
          <span>${new Date(n.ts).toLocaleString()}</span>
          ${n.job ? `<span>${escapeHtml(n.job)}</span>` : ""}
        </div>
        <div class="note-text">${escapeHtml(n.text)}</div>
        <div class="note-row-actions">
          <button data-action="copy">Copy</button>
          <button data-action="delete">Delete</button>
        </div>
      </li>
    `).join("");

    $$(".note-item", list).forEach((li) => {
      const id = li.dataset.id;
      const note = notes.find((n) => n.id === id);
      li.querySelector('[data-action="copy"]').addEventListener("click", () => {
        copyToClipboard(formatNoteForExport(note));
        showToast("Note copied");
      });
      li.querySelector('[data-action="delete"]').addEventListener("click", () => {
        Store.deleteNote(id);
        renderNotes();
        showToast("Note deleted");
      });
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  function initNotes() {
    $("#note-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#note-text").value.trim();
      if (!text) return;
      Store.saveNote({ id: makeNoteId(), ts: Date.now(), job: $("#note-job").value.trim(), text });
      $("#note-text").value = "";
      $("#note-job").value = "";
      renderNotes();
      showToast("Note saved");
    });
    $("#notes-export").addEventListener("click", () => {
      const notes = Store.getNotes();
      if (!notes.length) { showToast("No notes to export"); return; }
      const text = notes.map(formatNoteForExport).join("\n\n");
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ys-plan-job-notes-" + new Date().toISOString().slice(0, 10) + ".txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    $("#notes-copy-all").addEventListener("click", () => {
      const notes = Store.getNotes();
      if (!notes.length) { showToast("No notes to copy"); return; }
      copyToClipboard(notes.map(formatNoteForExport).join("\n\n"));
      showToast("All notes copied");
    });
  }

  // ---------- Init ----------
  function init() {
    initThemeToggle();
    initTabbar();
    initNotes();
    renderWiring();
    renderTips();
    renderNotes();
    restartTree();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
