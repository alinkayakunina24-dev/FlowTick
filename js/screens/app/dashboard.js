// APP Dashboard (tasks) — Figma node 2942:33143
// Tasks from AppData, grouped as overdue / today / upcoming. Tapping a task marks it
// done: it moves down into "Done" and leaves the list the next day. Tapping a day in the
// week strip shows that day's tasks. "Add new reminder" adds a task to the shown day.

window.Screens = window.Screens || {};

window.Screens.dashboard = {
  render(app) {
    const D = AppData;
    const view = { day: D.today(), adding: false };

    const time12 = (t) => {
      const [h, m] = t.split(":").map(Number);
      return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
    };

    // "11:00 AM", or a relative day when there's no time
    function when(task) {
      if (task.time) return time12(task.time);
      const diff = Math.round((D.fromKey(task.date) - D.today()) / D.DAY);
      if (diff === 0) return "Today";
      if (diff === -1) return "Yesterday";
      if (diff === 1) return "Tomorrow";
      if (diff < 0) return `${-diff} days ago`;
      return D.fromKey(task.date).toLocaleString("en", { weekday: "long" });
    }

    const byTime = (a, b) => (a.date + (a.time || "99")).localeCompare(b.date + (b.time || "99"));

    // The circle marks the task done; the rest of the row opens its details
    const taskRow = (t) => `
      <div class="task el-${t.done ? t.element : D.fromKey(t.date) < D.today() ? "red" : t.element}" data-task="${t.id}" aria-pressed="${t.done}">
        <button class="el-icon el-icon--small task__check" type="button" data-check aria-label="${t.done ? "Mark as not done" : "Mark as done"}">
          <img src="assets/app/${t.done ? "task-done" : "task-check"}.svg" alt="" width="16" height="16" />
        </button>
        <button class="task__text" type="button" data-open aria-label="Open ${UI.escape(t.title)}">
          <span>${UI.escape(t.title)}</span>
          <span class="task__time">${when(t)}${t.notes ? " · ✎ note" : ""}</span>
        </button>
      </div>
    `;

    // Task details: title, notes, date, time, element; done, delete, save
    function openTask(id) {
      const t = D.tasks().find((x) => x.id === id);
      if (!t) return;
      let element = t.element;
      Modal.open(el, {
        title: t.done ? "Done ✓" : "Task",
        body: `
          <label class="modal-field"><span>Title</span><input type="text" data-f="title" value="${UI.escape(t.title)}" /></label>
          <label class="modal-field"><span>Description</span><textarea rows="3" data-f="notes" placeholder="Add details, links, a checklist…">${UI.escape(t.notes || "")}</textarea></label>
          <div class="add-form__row">
            <label class="modal-field"><span>Date</span><input type="date" data-f="date" value="${t.date}" /></label>
            <label class="modal-field"><span>Time</span><input type="time" data-f="time" value="${t.time || ""}" /></label>
          </div>
          <div class="modal-field"><span>Element</span>
            <div class="chips">
              ${D.ELEMENTS.map((e) => `
                <button class="chip chip--element el-${e}" type="button" data-element="${e}" aria-pressed="${e === element}" aria-label="${e}">
                  <img src="assets/app/element-${e}-small.svg" alt="" />
                </button>`).join("")}
            </div>
          </div>
          <div class="modal__actions">
            <button class="text-action text-action--red" type="button" data-delete>Delete</button>
            <button class="text-action text-action--green" type="button" data-done>${t.done ? "Mark not done" : "Mark done ✓"}</button>
            <button class="text-action text-action--purple" type="button" data-save>Save</button>
          </div>
        `,
        onMount(panel, close) {
          panel.querySelectorAll("[data-element]").forEach((chip) =>
            chip.addEventListener("click", () => {
              element = chip.dataset.element;
              panel.querySelectorAll("[data-element]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
            })
          );
          const f = (name) => panel.querySelector(`[data-f="${name}"]`).value;
          panel.querySelector("[data-save]").addEventListener("click", () => {
            if (!f("title").trim()) return;
            D.updateTask(id, { title: f("title").trim(), notes: f("notes").trim(), date: f("date") || t.date, time: f("time"), element });
            close();
          });
          panel.querySelector("[data-done]").addEventListener("click", () => {
            D.toggleTask(id);
            close();
          });
          panel.querySelector("[data-delete]").addEventListener("click", () => {
            D.deleteTask(id);
            close();
          });
        },
      });
    }

    const group = (id, label, list) => !list.length ? "" : `
      <section class="task-group" data-group="${id}">
        <span class="status-pill status-pill--${id}">${label}</span>
        <div class="task-group__list">${list.map(taskRow).join("")}</div>
      </section>
    `;

    function build() {
      const tasks = D.tasks();
      const todayKey = D.key(D.today());
      const dayKey = D.key(view.day);
      // Done tasks stay in the archive only on the day they were done
      const archive = tasks.filter((t) => t.done && t.doneAt === todayKey);

      let groups;
      if (dayKey === todayKey) {
        groups =
          group("overdue", "OVERDUE", tasks.filter((t) => !t.done && t.date < todayKey).sort(byTime)) +
          group("today", "TODAY", tasks.filter((t) => !t.done && t.date === todayKey).sort(byTime)) +
          group("upcoming", "UPCOMING", tasks.filter((t) => !t.done && t.date > todayKey).sort(byTime)) +
          group("done", "DONE", archive.sort(byTime));
      } else {
        const label = view.day.toLocaleString("en", { weekday: "long", day: "numeric", month: "short" }).toUpperCase();
        const dayTasks = tasks.filter((t) => t.date === dayKey && (!t.done || t.doneAt === todayKey));
        groups =
          group("today", label, dayTasks.filter((t) => !t.done).sort(byTime)) +
          group("done", "DONE", dayTasks.filter((t) => t.done).sort(byTime));
        if (!dayTasks.length) groups = `<p class="hint">Nothing planned for ${label.toLowerCase()} yet.</p>`;
      }

      const todays = tasks.filter((t) => t.date === todayKey);
      const doneToday = todays.filter((t) => t.done).length;
      const t = D.today();
      const levels = D.elementLevels(D.addDays(t, -D.weekday(t)), t);
      const harmony = Math.round(D.ELEMENTS.reduce((s, e) => s + levels[e], 0) / D.ELEMENTS.length);

      const addForm = view.adding ? `
        <form class="add-form card">
          <input class="add-form__title" type="text" placeholder="New reminder..." aria-label="Reminder" required />
          <div class="add-form__row">
            <input class="time-field" type="time" aria-label="Time" />
            <div class="chips">
              ${D.ELEMENTS.map((e, i) => `
                <button class="chip chip--element el-${e}" type="button" data-element="${e}" aria-pressed="${i === 1}" aria-label="${e}">
                  <img src="assets/app/element-${e}-small.svg" alt="" />
                </button>`).join("")}
            </div>
          </div>
          <div class="add-form__row">
            <button class="btn-link" type="button" data-cancel>Cancel</button>
            <button class="pill-button el-air" type="submit">Add reminder</button>
          </div>
        </form>
      ` : `
        <button class="add-task el-air" type="button" data-add>
          <span class="el-icon el-icon--small"><img src="assets/app/task-done.svg" alt="" width="16" height="16" /></span>
          Add new reminder
        </button>
      `;

      return `
        ${AppShell.header({ title: `Hi, ${AppShell.userName()}!`, subtitle: "Your light is balanced today." })}
        ${AppShell.weekStrip({ spread: true, selected: view.day })}

        <section class="app-section app-section--tight" data-enter>
          ${AppShell.label(`TODAY  ·  ${doneToday} / ${todays.length} DONE`)}
          <span class="sync-pill">✦  ${harmony}% Elemental Sync</span>
          ${AppShell.label("TODAY'S FOCUS")}
          ${AppShell.focusCard()}
        </section>

        <div class="task-groups" data-enter>${groups}</div>

        ${addForm}
      `;
    }

    function wireContent() {
      el.querySelectorAll("[data-task]").forEach((row) => {
        row.querySelector("[data-check]").addEventListener("click", () => {
          row.classList.add("task--leaving");
          setTimeout(() => D.toggleTask(row.dataset.task), 350);
        });
        row.querySelector("[data-open]").addEventListener("click", () => openTask(row.dataset.task));
      });
      const add = el.querySelector("[data-add]");
      if (add) add.addEventListener("click", () => {
        view.adding = true;
        update();
        el.querySelector(".add-form__title").focus();
      });
      const form = el.querySelector(".add-form");
      if (!form) return;
      let element = "air";
      form.querySelectorAll("[data-element]").forEach((chip) =>
        chip.addEventListener("click", () => {
          element = chip.dataset.element;
          form.querySelectorAll("[data-element]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
        })
      );
      form.querySelector("[data-cancel]").addEventListener("click", () => {
        view.adding = false;
        update();
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = form.querySelector(".add-form__title").value.trim();
        if (!title) return;
        view.adding = false;
        D.addTask(title, view.day, form.querySelector(".time-field").value, element);
      });
    }

    const onDay = (date) => {
      view.day = date;
      update();
    };

    function update() {
      AppShell.refresh(el, app, build(), { onDay });
      wireContent();
    }

    const el = AppShell.screen({ tab: "dashboard", content: build() });
    AppShell.wire(el, app, { onDay });
    wireContent();
    app.onLeave(D.onChange(update));
    return el;
  },
};
