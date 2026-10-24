// Modal — a glass panel that drops from the top over the current screen, for small
// editing windows (a task, a profile field, a friend, a timer length…).
//
// Modal.open(screen, { title, body, onMount(panel, close) })
//   body     HTML of the content
//   onMount  wire up the content; call close() when done
// Tap outside or press Esc to close.

window.Modal = (function () {
  function open(screen, { title, body, onMount, wide = false }) {
    const el = document.createElement("div");
    el.className = "modal";
    el.innerHTML = `
      <div class="modal__outside"></div>
      <div class="modal__panel glass-panel${wide ? " modal__panel--wide" : ""}" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="modal__head">
          <p class="modal__title">${title}</p>
          <button class="modal__close" type="button" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" stroke-linecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
          </button>
        </div>
        <div class="modal__body">${body}</div>
      </div>
    `;

    const onKey = (e) => e.key === "Escape" && close();

    function close() {
      if (el.classList.contains("modal--closing")) return;
      document.removeEventListener("keydown", onKey);
      el.classList.add("modal--closing");
      setTimeout(() => el.remove(), 400);
    }

    el.querySelector(".modal__outside").addEventListener("click", close);
    el.querySelector(".modal__close").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    screen.appendChild(el);
    if (onMount) onMount(el.querySelector(".modal__panel"), close);
    return close;
  }

  // A simple "edit one value" window
  function field(screen, { title, label, value = "", type = "text", multiline = false, onSave }) {
    return open(screen, {
      title,
      body: `
        <label class="modal-field">
          <span>${label}</span>
          ${multiline
            ? `<textarea rows="4">${UI.escape(value)}</textarea>`
            : `<input type="${type}" value="${UI.escape(value)}" />`}
        </label>
        <div class="modal__actions">
          <button class="text-action" type="button" data-cancel>Cancel</button>
          <button class="text-action text-action--purple" type="button" data-save>Save</button>
        </div>
      `,
      onMount(panel, close) {
        const input = panel.querySelector("input, textarea");
        input.focus();
        if (input.select && type === "text") input.select();
        const save = () => {
          onSave(input.value.trim());
          close();
        };
        panel.querySelector("[data-save]").addEventListener("click", save);
        panel.querySelector("[data-cancel]").addEventListener("click", close);
        if (!multiline) input.addEventListener("keydown", (e) => e.key === "Enter" && save());
      },
    });
  }

  // Time picker: two wheels (minutes, seconds), like an alarm clock.
  // onSet(totalSeconds)
  function time(screen, { title = "Set time", seconds = 1500, max = 180, onSet }) {
    const wheel = (count, step, selected, label) => `
      <div class="wheel" data-wheel>
        <div class="wheel__list">
          ${Array.from({ length: Math.ceil(count / step) }, (_, i) => i * step).map((n) => `
            <span class="wheel__item${n === selected ? " is-selected" : ""}" data-value="${n}">${String(n).padStart(2, "0")}</span>
          `).join("")}
        </div>
        <span class="wheel__label">${label}</span>
      </div>
    `;
    return open(screen, {
      title,
      body: `
        <div class="wheels">
          ${wheel(max + 1, 1, Math.floor(seconds / 60), "min")}
          <span class="wheels__colon">:</span>
          ${wheel(60, 5, Math.floor((seconds % 60) / 5) * 5, "sec")}
          <div class="wheels__band"></div>
        </div>
        <label class="modal-field modal-field--row">
          <span>Or type it</span>
          <input type="text" inputmode="numeric" placeholder="25:00" data-typed />
        </label>
        <div class="modal__actions">
          <button class="text-action" type="button" data-cancel>Cancel</button>
          <button class="text-action text-action--purple" type="button" data-save>Set</button>
        </div>
      `,
      onMount(panel, close) {
        const ROW = 36;
        const lists = [...panel.querySelectorAll(".wheel__list")];
        // Start each wheel on its chosen value
        lists.forEach((list) => {
          const items = [...list.children];
          const index = items.findIndex((i) => i.classList.contains("is-selected"));
          requestAnimationFrame(() => (list.scrollTop = Math.max(0, index) * ROW));
          let t = null;
          list.addEventListener("scroll", () => {
            clearTimeout(t);
            t = setTimeout(() => {
              const i = Math.round(list.scrollTop / ROW);
              items.forEach((item, k) => item.classList.toggle("is-selected", k === i));
            }, 60);
          });
          items.forEach((item, k) => item.addEventListener("click", () => list.scrollTo({ top: k * ROW, behavior: "smooth" })));
        });
        const value = (list) => Number(list.children[Math.round(list.scrollTop / ROW)]?.dataset.value || 0);
        panel.querySelector("[data-cancel]").addEventListener("click", close);
        panel.querySelector("[data-save]").addEventListener("click", () => {
          const typed = panel.querySelector("[data-typed]").value.trim();
          let total;
          if (typed) {
            const [m, s = 0] = typed.split(/[:.,\s]/).map(Number);
            total = (m || 0) * 60 + (s || 0);
          } else {
            total = value(lists[0]) * 60 + value(lists[1]);
          }
          if (total > 0) onSet(Math.min(total, max * 60));
          close();
        });
      },
    });
  }

  return { open, field, time };
})();
