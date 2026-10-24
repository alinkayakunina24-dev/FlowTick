// Settings & sub-screens (Figma row 4, nodes 3312:5902 … 3312:7529):
//   profile, reminders (Smart Reminders), battle (Battle with a Friend), settings,
//   notifications, privacy, theme-settings, font, language, help.
// Everything is saved in Store, so it stays after a reload.

window.Screens = window.Screens || {};

(function () {
  const BACK = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>`;
  const PEN = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M9.5 1.5l3 3L5 12l-3.5.5L2 9z"/></svg>`;
  const CHEVRON = `<svg width="8" height="12" viewBox="0 0 8 12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1l5 5-5 5"/></svg>`;

  // Back button and title; the content scrolls; an optional main button at the bottom
  function layout({ id, title, content, action }) {
    const el = document.createElement("section");
    el.className = `screen sub-screen sub-screen--${id}`;
    el.innerHTML = `
      <div class="sub-screen__inner">
        <header class="focus-head" data-enter>
          <button class="icon-square" type="button" data-back aria-label="Back">${BACK}</button>
          <h1 class="focus-head__title">${title}</h1>
          <span class="focus-head__space"></span>
        </header>
        <div class="sub-screen__body" data-enter>${content}</div>
        ${action ? `<div class="focus-screen__actions"><button class="btn-session" type="button" data-main>${action}</button></div>` : ""}
      </div>
    `;
    return el;
  }

  // Back: to the given screen, or to the main screen — with the side menu open again
  // if this page was opened from it (settings pages keep that through `fromMenu`)
  function wireBack(el, app, back, fromMenu) {
    el.querySelector("[data-back]").addEventListener("click", () => {
      if (back) return app.go(back, { transition: "fade", duration: 700, params: { fromMenu } });
      if (fromMenu) Drawer.reopen();
      app.go(AppShell.lastTab(), { transition: "fade", duration: 700 });
    });
  }

  function saved(el, text = "Your changes are saved.") {
    Notice.show(el, { title: "Saved", text, icon: "assets/app/element-earth-small.svg", element: "earth", tone: "green" });
  }

  // ---------- Profile ----------

  // Birthday is stored as 1995-03-21 and shown as "March 21, 1995"
  const show = (field, value) =>
    field.type === "date" && value ? new Date(`${value}T12:00`).toLocaleString("en", { month: "long", day: "numeric", year: "numeric" }) : value || "—";

  window.Screens.profile = {
    render(app, params = {}) {
      const s = Store.get();
      const fields = [
        { key: "name", label: "Name", type: "text" },
        { key: "username", label: "Username", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "birthday", label: "Birthday", type: "date" },
        { key: "location", label: "Location", type: "text" },
      ];
      const el = layout({
        id: "profile",
        title: "Profile",
        content: `
          <div class="profile-photo">
            <img class="profile-photo__ring" src="assets/images/mandala-grid.png" alt="" />
            <img class="profile-photo__img${s.avatar ? " is-own" : ""}" src="${AppShell.avatar()}" alt="Your photo" />
          </div>
          <label class="profile-photo__change">Change Photo<input type="file" accept="image/*" hidden /></label>
          <p class="section-label">PERSONAL INFO</p>
          ${fields.map((f) => `
            <div class="field">
              <span class="field__label">${f.label}</span>
              <span class="field__row">
                <span class="field__value" data-value="${f.key}">${UI.escape(show(f, s[f.key]))}</span>
                <button class="field__edit" type="button" data-edit="${f.key}" aria-label="Edit ${f.label}">${PEN}</button>
              </span>
            </div>
          `).join("")}
          <p class="section-label">BIOGRAPHY</p>
          <div class="field">
            <span class="field__row">
              <span class="field__value" data-value="bio">${UI.escape(s.bio || "")}</span>
              <button class="field__edit" type="button" data-edit="bio" aria-label="Edit biography">${PEN}</button>
            </span>
          </div>
        `,
      });

      // The pencil opens a small window to change the value
      el.querySelectorAll("[data-edit]").forEach((button) =>
        button.addEventListener("click", () => {
          const key = button.dataset.edit;
          const f = fields.find((x) => x.key === key) || { key: "bio", label: "Biography", type: "text" };
          Modal.field(el, {
            title: `Edit ${f.label.toLowerCase()}`,
            label: f.label,
            value: Store.get()[key] || "",
            type: f.type,
            multiline: key === "bio",
            onSave(value) {
              Store.set({ [key]: value });
              el.querySelector(`[data-value="${key}"]`).textContent = show(f, value);
              saved(el);
            },
          });
        })
      );

      // A new photo is made small (240px) before saving, so it fits in storage
      el.querySelector('input[type="file"]').addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
          const size = 240;
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = size;
          const scale = Math.max(size / img.width, size / img.height);
          canvas.getContext("2d").drawImage(img, (size - img.width * scale) / 2, (size - img.height * scale) / 2, img.width * scale, img.height * scale);
          const url = canvas.toDataURL("image/jpeg", 0.85);
          Store.set({ avatar: url });
          const photo = el.querySelector(".profile-photo__img");
          photo.src = url;
          photo.classList.add("is-own");
          saved(el, "Your new photo is everywhere in Shine.");
          URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
      });

      wireBack(el, app, null, params.fromMenu);
      return el;
    },
  };

  // ---------- Smart Reminders ----------

  const PLACES = ["When I'm home", "Near a coffee shop", "At work", "At the gym", "At IKEA", "Near the pharmacy"];
  const SAMPLE_REMINDERS = [
    { id: "r1", title: "Smart Reminder", place: "Battle with a Friend", icon: "pill" },
    { id: "r2", title: "Check today's tasks", place: "When I'm home", icon: "pen" },
    { id: "r3", title: "Order coffee", place: "Near a coffee shop", icon: "cup" },
  ];
  const REMINDER_ICONS = {
    pill: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"><rect x="1.5" y="6.5" width="15" height="5" rx="2.5" transform="rotate(-45 9 9)"/><path d="M6.5 6.5l5 5" /></svg>`,
    pen: PEN,
    cup: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M3 7h10v5a4 4 0 01-4 4H7a4 4 0 01-4-4z"/><path d="M13 9h1.5a2 2 0 010 4H13M6 2v2M9 2v2"/></svg>`,
    pin: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"><path d="M9 16s5-5 5-9a5 5 0 00-10 0c0 4 5 9 5 9z"/><circle cx="9" cy="7" r="1.8"/></svg>`,
  };

  // "+ New place…" in the list shows a field to type your own place
  function wireNewPlace(root) {
    const select = root.querySelector('[data-f="place"]');
    const field = root.querySelector("[data-new-place]");
    select.addEventListener("change", () => {
      field.hidden = select.value !== "__new";
      if (!field.hidden) field.querySelector("input").focus();
    });
  }

  function placeOf(root) {
    const select = root.querySelector('[data-f="place"]');
    if (select.value !== "__new") return select.value;
    const typed = root.querySelector("[data-new-place] input").value.trim();
    return typed ? typed.charAt(0).toUpperCase() + typed.slice(1) : "";
  }

  window.Screens.reminders = {
    render(app, params = {}) {
      const list = () => Store.get().reminders || SAMPLE_REMINDERS;
      const el = layout({ id: "reminders", title: "Smart Reminders", content: "" });
      const body = el.querySelector(".sub-screen__body");
      let adding = false;

      function draw() {
        body.innerHTML = `
          <div class="map">
            <img src="assets/images/map.jpg" alt="Map" />
            <span class="map__spot map__spot--yellow" style="left: 32%; top: 38%"><i>✕</i></span>
            <span class="map__spot map__spot--green" style="left: 70%; top: 66%"><i>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"><circle cx="7" cy="4.5" r="2.5"/><path d="M2 13c0-3 2.2-4.5 5-4.5s5 1.5 5 4.5"/></svg>
            </i></span>
          </div>
          <p class="section-label">ELEMENT THEMES</p>
          ${list().map((r) => `
            <div class="reminder card" data-id="${r.id}" role="button" tabindex="0">
              <span class="reminder__icon">${REMINDER_ICONS[r.icon] || REMINDER_ICONS.pin}</span>
              <span class="reminder__text">
                <span>${UI.escape(r.title)}</span>
                <span class="reminder__place">${UI.escape(r.place)}</span>
              </span>
              <button class="reminder__delete" type="button" data-delete="${r.id}" aria-label="Delete">✕</button>
            </div>
          `).join("")}
          ${adding ? `
            <form class="add-form card">
              <input class="add-form__title" type="text" placeholder="Remind me to…" required />
              <label class="modal-field"><span>Where</span>
                <select class="select-field" data-f="place">${PLACES.map((p) => `<option>${p}</option>`).join("")}<option value="__new">+ New place…</option></select>
              </label>
              <label class="modal-field" data-new-place hidden><span>New place</span><input type="text" placeholder="e.g. At grandma's" /></label>
              <div class="add-form__row">
                <button class="text-action" type="button" data-cancel>Cancel</button>
                <button class="pill-button el-air" type="submit">Add reminder</button>
              </div>
            </form>
          ` : `
            <button class="add-task el-air" type="button" data-add>
              <span class="el-icon el-icon--small"><img src="assets/app/task-done.svg" alt="" width="16" height="16" /></span>
              Add new task…
            </button>
          `}
        `;

        // Tap a reminder to change what and where
        body.querySelectorAll(".reminder").forEach((row) =>
          row.addEventListener("click", (e) => {
            if (e.target.closest("[data-delete]")) return;
            const r = list().find((x) => x.id === row.dataset.id);
            const places = PLACES.includes(r.place) ? PLACES : [r.place, ...PLACES];
            Modal.open(el, {
              title: "Edit reminder",
              body: `
                <label class="modal-field"><span>Remind me to</span><input type="text" data-f="title" value="${UI.escape(r.title)}" /></label>
                <label class="modal-field"><span>Where</span>
                  <select data-f="place">${places.map((p) => `<option ${p === r.place ? "selected" : ""}>${UI.escape(p)}</option>`).join("")}<option value="__new">+ New place…</option></select>
                </label>
                <label class="modal-field" data-new-place hidden><span>New place</span><input type="text" placeholder="e.g. At grandma's" /></label>
                <div class="modal__actions">
                  <button class="text-action text-action--red" type="button" data-remove>Delete</button>
                  <button class="text-action text-action--purple" type="button" data-save>Save</button>
                </div>
              `,
              onMount(panel, close) {
                wireNewPlace(panel);
                panel.querySelector("[data-save]").addEventListener("click", () => {
                  const title = panel.querySelector('[data-f="title"]').value.trim();
                  if (!title) return;
                  const place = placeOf(panel);
                  if (!place) return;
                  Store.set({ reminders: list().map((x) => (x.id === r.id ? { ...x, title, place } : x)) });
                  close();
                  draw();
                });
                panel.querySelector("[data-remove]").addEventListener("click", () => {
                  Store.set({ reminders: list().filter((x) => x.id !== r.id) });
                  close();
                  draw();
                });
              },
            });
          })
        );
        body.querySelectorAll("[data-delete]").forEach((b) =>
          b.addEventListener("click", () => {
            Store.set({ reminders: list().filter((r) => r.id !== b.dataset.delete) });
            draw();
          })
        );
        const add = body.querySelector("[data-add]");
        if (add) add.addEventListener("click", () => {
          adding = true;
          draw();
          body.querySelector(".add-form__title").focus();
        });
        const form = body.querySelector(".add-form");
        if (form) {
          form.querySelector("[data-cancel]").addEventListener("click", () => {
            adding = false;
            draw();
          });
          wireNewPlace(form);
          form.addEventListener("submit", (e) => {
            e.preventDefault();
            const title = form.querySelector(".add-form__title").value.trim();
            if (!title) return;
            const place = placeOf(form);
            if (!place) return;
            Store.set({ reminders: [...list(), { id: `r${Date.now()}`, title, place, icon: place.includes("coffee") ? "cup" : "pin" }] });
            adding = false;
            draw();
            saved(el, `We'll remind you ${place.toLowerCase()}.`);
          });
        }
      }

      draw();
      wireBack(el, app, null, params.fromMenu);
      return el;
    },
  };

  // ---------- Battle with a Friend ----------

  const FRIENDS = [
    { id: "lina", name: "Lina", photo: "assets/settings/friend-lina.jpg" },
    { id: "mia", name: "Mia", color: "#947ce3" },
    { id: "sofia", name: "Sofia", color: "#ee762a" },
    { id: "emma", name: "Emma", color: "#35abeb" },
    { id: "noah", name: "Noah", color: "#56c079" },
  ];
  const LENGTHS = { week: { label: "1 week", days: 7 }, two: { label: "2 weeks", days: 14 }, month: { label: "1 month", days: 30 } };
  const friendPhoto = (f) => f.photo
    ? `<img src="${f.photo}" alt="" />`
    : `<span class="friend-initial" style="--c: ${f.color}">${f.name[0]}</span>`;

  window.Screens.battle = {
    render(app, params = {}) {
      const D = AppData;
      const setup = Store.get().battle || { friend: "lina", length: "week" };
      const friend = FRIENDS.find((f) => f.id === setup.friend) || FRIENDS[0];
      const t = D.today();
      const monday = D.addDays(t, -D.weekday(t));
      const days = D.weekday(t) + 1;
      const habits = D.habits().filter((h) => h.element !== "air");

      // Your points: 10 per habit done this week; Lina's are sample numbers
      const rows = habits.map((h) => {
        let mine = 0;
        for (let i = 0; i < days; i++) if (D.isDone(h.id, D.addDays(monday, i))) mine += 1;
        const hers = Math.min(days, Math.round(D.seeded(`${friend.id}|${h.id}|${D.key(monday)}`) * days + 0.4));
        return { h, mine, hers };
      });
      const you = 500 + rows.reduce((s, r) => s + r.mine, 0) * 10 + D.rangeRituals(monday, t) * 3;
      const lina = 500 + rows.reduce((s, r) => s + r.hers, 0) * 10 + Math.round(D.seeded(`${friend.id}|${D.key(monday)}`) * 60);
      const share = Math.round((you / (you + lina)) * 100);
      const end = D.addDays(monday, LENGTHS[setup.length].days);
      const left = end - new Date();
      const leftText = `${Math.floor(left / D.DAY)}d ${Math.floor((left % D.DAY) / 3600000)}h left`;
      const dots = (n, color) => `<span class="battle-dots battle-dots--${color}">${Array.from({ length: 7 }, (_, i) => `<i${i < n ? ' class="on"' : ""}></i>`).join("")}</span>`;

      const el = layout({
        id: "battle",
        title: "Battle with a Friend",
        content: `
          <div class="battle-card">
            <p class="battle-card__live">LIVE BATTLE · ${LENGTHS[setup.length].label.toUpperCase()}</p>
            <span class="battle-card__left">${leftText}</span>
            <div class="battle-card__players">
              <div class="battle-player">
                ${you >= lina ? '<span class="battle-player__crown">👑</span>' : ""}
                <img class="${Store.get().avatar ? "is-own" : ""}" src="${AppShell.avatar()}" alt="" />
                <span>${AppShell.userName()}<br />${you} pts</span>
              </div>
              <span class="battle-card__vs">VS</span>
              <button class="battle-player battle-player--friend" type="button" data-friend aria-label="Change friend">
                ${lina > you ? '<span class="battle-player__crown">👑</span>' : ""}
                ${friendPhoto(friend)}
                <span>${friend.name}<br />${lina} pts</span>
              </button>
            </div>
          </div>
          <div class="battle-bar card">
            <span>${AppShell.userName()}</span>
            <span class="battle-bar__track" style="--share: ${share}%"><i class="planet"></i></span>
            <span>${friend.name}</span>
          </div>
          <p class="hint">Habit scores this week<br />Each completion = +10 pts</p>
          ${rows.map(({ h, mine, hers }) => `
            <div class="battle-habit el-${h.element}">
              <span class="el-icon"><img src="assets/app/element-${h.element}-small.svg" alt="" /></span>
              <span class="battle-habit__body">
                <span>${h.title}</span>
                <span class="battle-habit__scores">
                  <span>${mine}/7 ${dots(mine, "green")}</span>
                  <span>${hers}/7 ${dots(hers, "yellow")}</span>
                </span>
              </span>
            </div>
          `).join("")}
        `,
      });

      // Change the friend and the length of the battle
      const editBattle = () => {
        let chosen = setup.friend;
        let length = setup.length;
        Modal.open(el, {
          title: "Battle settings",
          body: `
            <p class="section-label">FRIEND</p>
            <div class="friend-list">
              ${FRIENDS.map((f) => `
                <button class="friend-pick" type="button" data-pick="${f.id}" aria-pressed="${f.id === chosen}">
                  ${friendPhoto(f)}<span>${f.name}</span>
                </button>`).join("")}
            </div>
            <p class="section-label">LENGTH</p>
            <div class="chips">
              ${Object.entries(LENGTHS).map(([id, l]) => `<button class="chip" type="button" data-length="${id}" aria-pressed="${id === length}">${l.label}</button>`).join("")}
            </div>
            <div class="modal__actions">
              <button class="text-action text-action--green" type="button" data-invite>+ Invite a new friend</button>
              <button class="text-action text-action--purple" type="button" data-save>Start battle</button>
            </div>
          `,
          onMount(panel, close) {
            panel.querySelectorAll("[data-pick]").forEach((b) =>
              b.addEventListener("click", () => {
                chosen = b.dataset.pick;
                panel.querySelectorAll("[data-pick]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
              })
            );
            panel.querySelectorAll("[data-length]").forEach((b) =>
              b.addEventListener("click", () => {
                length = b.dataset.length;
                panel.querySelectorAll("[data-length]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
              })
            );
            panel.querySelector("[data-invite]").addEventListener("click", () => {
              close();
              Notice.show(el, { title: "Invite link copied", text: "Send it to a friend — they'll appear here when they join Shine.", icon: "assets/app/element-air-small.svg", element: "air", tone: "green" });
            });
            panel.querySelector("[data-save]").addEventListener("click", () => {
              Store.set({ battle: { friend: chosen, length } });
              close();
              app.go("battle", { transition: "fade", duration: 600 });
            });
          },
        });
      };
      el.querySelector("[data-friend]").addEventListener("click", editBattle);
      el.querySelector(".battle-card__live").addEventListener("click", editBattle);
      wireBack(el, app, null, params.fromMenu);
      return el;
    },
  };

  // ---------- Settings ----------

  const ITEMS = [
    { id: "notifications", label: "Notifications", icon: `<path d="M4 7a5 5 0 0110 0v3l1.5 3h-13L4 10z"/><path d="M7.5 15.5a1.6 1.6 0 003 0"/>` },
    { id: "privacy", label: "Privacy", icon: `<rect x="3.5" y="8" width="11" height="8" rx="1.5"/><path d="M6 8V5.5a3 3 0 016 0V8"/>` },
    { id: "theme-settings", label: "Theme", icon: `<path d="M9 1.5a7.5 7.5 0 100 15c1 0 1.3-.8.9-1.6-.5-1 .2-2.1 1.3-2.1H13a3.5 3.5 0 003.5-3.5C16.5 5 13.1 1.5 9 1.5z"/><circle cx="5.5" cy="8" r="1"/><circle cx="8" cy="5" r="1"/><circle cx="12" cy="6" r="1"/>` },
    { id: "font", label: "Font", icon: `<path d="M3 3h12M9 3v12M6.5 15h5"/>` },
    { id: "language", label: "Language", icon: `<circle cx="9" cy="9" r="7.5"/><path d="M1.5 9h15M9 1.5c2.2 2.2 2.2 12.8 0 15M9 1.5c-2.2 2.2-2.2 12.8 0 15"/>` },
    { id: "help", label: "Help & Chat", icon: `<path d="M9 1.5a7.5 7.5 0 00-6.6 11L1.5 16.5l4-.9A7.5 7.5 0 109 1.5z"/>` },
  ];

  window.Screens.settings = {
    render(app, params = {}) {
      const el = layout({
        id: "settings",
        title: "Settings",
        content: `
          <button class="hint sub-link" type="button" data-open="help">Have questions about the app? Chat with us.</button>
          <div class="settings-list card">
            ${ITEMS.map((i) => `
              <button class="settings-item" type="button" data-open="${i.id}">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${i.icon}</svg>
                <span>${i.label}</span>
                ${CHEVRON}
              </button>
            `).join("")}
          </div>
        `,
      });
      el.querySelectorAll("[data-open]").forEach((b) =>
        b.addEventListener("click", () => app.go(b.dataset.open, { transition: "fade", duration: 700, params: { fromMenu: params.fromMenu } }))
      );
      wireBack(el, app, null, params.fromMenu);
      return el;
    },
  };

  // ---------- Notifications ----------

  window.Screens.notifications = {
    render(app, params = {}) {
      const n = Store.get().notifications;
      const toggles = [
        { key: "allow", title: "Allow Notifications", text: "Stay updated with your daily radiance reminders." },
        { key: "daily", title: "Daily Reminders", text: "Daily reminders help you stay consistent with your elemental practice and focus sessions." },
      ];
      const el = layout({
        id: "notifications",
        title: "Notifications",
        content: `
          <p class="section-label">PERSONAL INFO</p>
          <div class="settings-list card">
            ${toggles.map((t) => `
              <label class="toggle-row">
                <span><b>${t.title}</b><br />${t.text}</span>
                <input class="toggle" type="checkbox" role="switch" data-key="${t.key}" ${n[t.key] ? "checked" : ""} />
              </label>
            `).join("")}
          </div>
        `,
      });
      el.querySelectorAll("[data-key]").forEach((input) =>
        input.addEventListener("change", () => {
          Store.set({ notifications: { ...Store.get().notifications, [input.dataset.key]: input.checked } });
        })
      );
      wireBack(el, app, "settings", params.fromMenu);
      return el;
    },
  };

  // ---------- Privacy ----------

  window.Screens.privacy = {
    render(app, params = {}) {
      const el = layout({
        id: "privacy",
        title: "Privacy",
        action: "Save New Password",
        content: `
          <p class="section-label">PASSWORD</p>
          <div class="card settings-form">
            <label class="field field--plain"><span class="field__label">Current Password</span><input class="pill-field" type="password" autocomplete="current-password" /></label>
            <label class="field field--plain"><span class="field__label">New Password</span><input class="pill-field" type="password" autocomplete="new-password" /></label>
            <label class="field field--plain"><span class="field__label">Confirm New Password</span><input class="pill-field" type="password" autocomplete="new-password" /></label>
          </div>
          <label class="check-row"><input type="checkbox" data-show /> Show passwords</label>
          <label class="check-row"><input type="checkbox" data-remember checked /> Remember the password on this device</label>
          <p class="hint">At least 8 characters. Your data stays on this device.</p>
        `,
      });
      const [current, next, confirm] = el.querySelectorAll(".pill-field");
      el.querySelector("[data-show]").addEventListener("change", (e) =>
        [current, next, confirm].forEach((i) => (i.type = e.target.checked ? "text" : "password"))
      );
      el.querySelector("[data-main]").addEventListener("click", () => {
        let problem = "";
        if (!current.value) problem = "Enter your current password.";
        else if (next.value.length < 8) problem = "The new password needs at least 8 characters.";
        else if (next.value !== confirm.value) problem = "The new passwords don't match.";
        if (problem) {
          Notice.show(el, { title: "Not saved", text: problem, icon: "assets/app/element-fire-small.svg", element: "red", tone: "red" });
          return;
        }
        [current, next, confirm].forEach((i) => (i.value = ""));
        saved(el, "Your password has been changed.");
      });
      wireBack(el, app, "settings", params.fromMenu);
      return el;
    },
  };

  // ---------- Theme ----------

  window.Screens["theme-settings"] = {
    render(app, params = {}) {
      const s = Store.get();
      let theme = s.theme || "dark";
      let element = s.element || "earth";
      const el = layout({
        id: "theme",
        title: "Theme",
        action: "Save Changes",
        content: `
          <p class="section-label">ELEMENT THEMES</p>
          <div class="theme-pick">
            <button class="theme-pick__orb theme-pick__orb--dark" type="button" data-theme="dark" aria-pressed="${theme === "dark"}">
              <img src="assets/images/mandala-grid.png" alt="Dark" />
            </button>
            <button class="theme-pick__orb theme-pick__orb--light" type="button" data-theme="light" aria-pressed="${theme === "light"}">
              <img src="assets/images/mandala-grid.png" alt="Light" />
            </button>
          </div>
          <div class="intentions__list intentions__list--settings">
            ${Elements.map((e) => `
              <button class="intention__row intention__row--${e.id}" type="button" data-element="${e.id}" aria-checked="${e.id === element}"
                      aria-label="${e.name}">
                <span class="intention__icon-card"><img src="assets/icons/element-${e.id}.png" width="42" height="48" alt="" /></span>
                <span class="intention__label-card"><span class="intention__name">${e.name}</span></span>
              </button>
            `).join("")}
          </div>
        `,
      });
      // Every tap shows the theme right away; it's kept only after "Save Changes"
      let keep = false;
      el.querySelectorAll("[data-theme]").forEach((b) =>
        b.addEventListener("click", () => {
          theme = b.dataset.theme;
          el.querySelectorAll("[data-theme]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          Theme.preview(theme, element);
        })
      );
      el.querySelectorAll("[data-element]").forEach((b) =>
        b.addEventListener("click", () => {
          element = b.dataset.element;
          el.querySelectorAll("[data-element]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
          Theme.preview(theme, element);
        })
      );
      el.querySelector("[data-main]").addEventListener("click", () => {
        Store.set({ theme, element });
        keep = true;
        saved(el, `${theme === "light" ? "Light" : "Dark"} ${AppShell.capital(element)} is your theme now.`);
      });
      app.onLeave(() => !keep && Theme.apply());
      wireBack(el, app, "settings", params.fromMenu);
      return el;
    },
  };

  // ---------- Font ----------

  window.Screens.font = {
    render(app, params = {}) {
      const f = { ...Store.get().font };
      const PRIMARY = ["Caudex", "Cormorant Garamond", "Lora", "Playfair Display", "EB Garamond", "Crimson Text", "Libre Baskerville", "Marcellus"];
      const SECONDARY = ["Allison", "Great Vibes", "Parisienne", "Dancing Script", "Pinyon Script", "Italianno", "Alex Brush", "Tangerine"];
      const el = layout({
        id: "font",
        title: "Font",
        action: "Save Changes",
        content: `
          <div class="card settings-form">
            <label class="field field--plain"><span class="field__label">Primary Font</span>
              <select class="pill-field" data-key="primary">${PRIMARY.map((p) => `<option ${p === f.primary ? "selected" : ""}>${p}</option>`).join("")}</select>
            </label>
            <label class="field field--plain"><span class="field__label">Secondary Font</span>
              <select class="pill-field" data-key="secondary">${SECONDARY.map((p) => `<option ${p === f.secondary ? "selected" : ""}>${p}</option>`).join("")}</select>
            </label>
            <label class="field field--plain"><span class="field__title">Text Size <span class="slider__value" data-show="size">${Math.round(f.size * 100)}%</span></span>
              <input class="slider" type="range" min="0.85" max="1.3" step="0.01" value="${f.size}" data-key="size" />
              <span class="slider__labels"><span>Small</span><span>Medium</span><span>Large</span></span>
            </label>
            <label class="field field--plain"><span class="field__title">Stroke Weight <span class="slider__value" data-show="stroke">${Math.round(f.stroke * 100)}%</span></span>
              <input class="slider" type="range" min="0" max="1" step="0.05" value="${Math.min(1, f.stroke)}" data-key="stroke" />
              <span class="slider__labels"><span>Thin</span><span></span><span>Bold</span></span>
            </label>
          </div>
          <p class="section-label">Preview</p>
          <p class="font-preview">"The Earth has music for those who listen." — George Santayana</p>
          <p class="font-preview font-preview--display">Shine</p>
        `,
      });
      // Changes show on the whole app right away; they're kept only after "Save Changes"
      let keep = false;
      el.querySelectorAll("[data-key]").forEach((input) =>
        input.addEventListener("input", () => {
          const key = input.dataset.key;
          f[key] = key === "size" || key === "stroke" ? Number(input.value) : input.value;
          const label = el.querySelector(`[data-show="${key}"]`);
          if (label) label.textContent = `${Math.round(f[key] * 100)}%`;
          Store.applyFont(f);
        })
      );
      el.querySelector("[data-main]").addEventListener("click", () => {
        Store.set({ font: { ...f } });
        keep = true;
        saved(el, "New fonts are applied across Shine.");
      });
      app.onLeave(() => !keep && Store.applyFont());
      wireBack(el, app, "settings", params.fromMenu);
      return el;
    },
  };

  // ---------- Language ----------

  const LANGUAGES = [
    ["en", "English", "English"],
    ["ar", "العربية", "Arabic"],
    ["zh", "中文", "Chinese"],
    ["nl", "Nederlands", "Dutch"],
    ["fr", "Français", "French"],
    ["de", "Deutsch", "German"],
    ["hi", "हिन्दी", "Hindi"],
    ["it", "Italiano", "Italian"],
    ["ja", "日本語", "Japanese"],
    ["da", "Dansk", "Danish"],
    ["es", "Español", "Spanish"],
    ["pt", "Português", "Portuguese"],
  ];

  window.Screens.language = {
    render(app, params = {}) {
      let chosen = Store.get().language || "en";
      const el = layout({
        id: "language",
        title: "Language",
        action: "Save Changes",
        content: `
          <div class="settings-list card" role="radiogroup" aria-label="Language">
            ${LANGUAGES.map(([code, name, english]) => `
              <button class="language-row" type="button" role="radio" data-lang="${code}" aria-checked="${code === chosen}">
                <span><b>${name}</b><br />${english}</span>
                <i class="radio"></i>
              </button>
            `).join("")}
          </div>
        `,
      });
      el.querySelectorAll("[data-lang]").forEach((b) =>
        b.addEventListener("click", () => {
          chosen = b.dataset.lang;
          el.querySelectorAll("[data-lang]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
        })
      );
      el.querySelector("[data-main]").addEventListener("click", () => {
        Store.set({ language: chosen });
        const name = LANGUAGES.find((l) => l[0] === chosen)[2];
        saved(el, chosen === "en" ? "Shine speaks English." : `${name} is saved. Translations are on their way — for now Shine stays in English.`);
      });
      wireBack(el, app, "settings", params.fromMenu);
      return el;
    },
  };

  // ---------- Help & Chat ----------

  const FAQ = [
    ["How do I reset my data?", "Go to your browser settings and clear the site data for Shine, or ask us in the chat — we'll walk you through it."],
    ["Can I sync across devices?", "Not yet. Right now everything lives on this device. Sync with your account is coming soon."],
    ["How do themes work?", "Your element sets the colours and pictures of the app. Choose it in Settings → Theme; the light theme is on its way."],
    ["Why did my streak reset?", "A day counts towards your streak when you complete at least three habits. Missing that resets it."],
  ];
  const REPLIES = [
    [/streak/i, "Your streak grows each day you complete at least three habits. Keep going! ✨"],
    [/theme|color|colour/i, "You can change your element in Settings → Theme."],
    [/password|privacy/i, "You can change your password in Settings → Privacy."],
    [/hello|hi|hey/i, "Hi! How can I help you today?"],
  ];

  window.Screens.help = {
    render(app, params = {}) {
      const el = layout({
        id: "help",
        title: "Help & Chat",
        content: `
          <p class="section-label">SUPPORT</p>
          <div class="card help-card">
            <p class="help-card__title"><span class="help-card__icon">💬</span>Help &amp; Chat</p>
            <p class="hint">Have a question? Chat with our team.</p>
            <div class="chat" hidden>
              <div class="chat__messages"><p class="chat__msg chat__msg--them">Hi ${AppShell.userName()}! I'm Sol from Shine. How can I help?</p></div>
              <form class="chat__form">
                <input class="pill-field" type="text" placeholder="Type a message…" aria-label="Message" />
                <button class="pill-button el-air" type="submit">Send</button>
              </form>
            </div>
            <button class="pill-button el-air help-card__open" type="button" data-chat>Open Chat</button>
          </div>
          <div class="card help-card">
            <p class="help-card__title"><span class="help-card__icon">?</span>FAQ</p>
            <p class="hint">Find answers to common questions.</p>
            ${FAQ.map(([q, a]) => `
              <details class="faq">
                <summary>${q}</summary>
                <p>${a}</p>
              </details>
            `).join("")}
          </div>
        `,
      });

      const chat = el.querySelector(".chat");
      const messages = el.querySelector(".chat__messages");
      el.querySelector("[data-chat]").addEventListener("click", (e) => {
        chat.hidden = false;
        e.currentTarget.remove();
        chat.querySelector("input").focus();
      });
      el.querySelector(".chat__form").addEventListener("submit", (e) => {
        e.preventDefault();
        const input = e.currentTarget.querySelector("input");
        const text = input.value.trim();
        if (!text) return;
        messages.insertAdjacentHTML("beforeend", `<p class="chat__msg chat__msg--me">${UI.escape(text)}</p>`);
        input.value = "";
        const reply = (REPLIES.find(([re]) => re.test(text)) || [0, "Thank you! Our team will get back to you here within a day."])[1];
        setTimeout(() => {
          messages.insertAdjacentHTML("beforeend", `<p class="chat__msg chat__msg--them">${reply}</p>`);
          messages.scrollTop = messages.scrollHeight;
        }, 900);
      });
      wireBack(el, app, "settings", params.fromMenu);
      return el;
    },
  };
})();
