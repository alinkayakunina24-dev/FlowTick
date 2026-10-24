// APP Home — Figma node 2942:33158
// Daily overview calculated from AppData: the week so far drives the elemental balance
// and the balance alert, today's focus time fills the progress bar, and the habit tiles
// mark the habits (the same marks Analytics shows). Tapping a day in the week strip
// shows that day's habits.

window.Screens = window.Screens || {};

// Themes on a bright picture use deeper orbits with light planets
const RINGS = { "dark-air": "rings-deep", "light-air": "rings-earthy" };

window.Screens.home = {
  render(app) {
    const D = AppData;
    const view = { day: D.today() };

    function weekLevels() {
      const t = D.today();
      return D.elementLevels(D.addDays(t, -D.weekday(t)), t);
    }

    function build() {
      const levels = weekLevels();
      const low = [...D.ELEMENTS].sort((a, b) => levels[a] - levels[b])[0];
      const lowName = AppShell.capital(low);
      const future = D.isFuture(view.day);

      const tiles = D.habits().map((h) => {
        const done = D.isDone(h.id, view.day);
        return `
          <button class="habit-tile el-${h.element}" type="button" data-habit="${h.id}" aria-pressed="${done}" ${future ? "disabled" : ""}>
            <span class="el-icon"><img src="assets/app/element-${h.element}-small.svg" alt="" /></span>
            <span class="habit-tile__name">${h.title}</span>
            <img class="habit-tile__check" src="assets/app/check-${done ? "active" : "passive"}.svg" alt="" width="16" height="16" />
          </button>
        `;
      }).join("");

      const dayLabel = D.isToday(view.day)
        ? "TODAY'S HABITS"
        : `HABITS · ${view.day.toLocaleString("en", { weekday: "long", day: "numeric", month: "short" }).toUpperCase()}`;

      return `
        ${AppShell.header({ title: `Hi, ${AppShell.userName()}!`, subtitle: levels[low] < 50 ? `Your ${lowName} needs care today.` : "Your light is balanced today.", boldSubtitle: true })}
        ${AppShell.weekStrip({ selected: view.day })}

        <section class="home-rings" data-enter>
          ${future
            ? '<img src="assets/app/rings-empty.svg" alt="Empty energy rings" width="320" height="320" /><p class="hint home-rings__note">This day hasn\'t come yet — its planets will appear as it unfolds.</p>'
            : `<img src="assets/app/${RINGS[document.documentElement.dataset.theme] || "rings"}.svg" alt="Energy rings of the five elements" width="320" height="320" />`}
          ${AppShell.divider()}
        </section>

        <section class="app-section" data-enter>
          <p class="alert ${levels[low] < 50 ? "alert--red" : "alert--calm"}" role="button" tabindex="0" data-notice="balance">
            <span>Balance Alert</span><br />${lowName} energy is ${levels[low] < 50 ? "critically low" : "your lowest"} (${levels[low]}%) this week. ${AppShell.ADVICE[low]}
          </p>
          ${AppShell.divider()}
        </section>

        <section class="app-section app-section--tight" data-enter>
          ${AppShell.label("ELEMENTAL BALANCE · THIS WEEK")}
          ${AppShell.balanceCard(levels)}
          <p class="hint">${AppShell.balanceTip(levels)}</p>
          ${AppShell.divider()}
        </section>

        <section class="app-section app-section--tight" data-enter>
          ${AppShell.label("TODAY'S FOCUS")}
          ${AppShell.focusCard()}
        </section>

        <p class="pill-card el-metal" data-enter role="button" tabindex="0" data-notice="location"><span>Smart Location</span><br />At IKEA — Buy candles, warm lights &amp; a plant pot.</p>

        <section class="app-section app-section--tight" data-enter>
          <div class="pill-card el-earth pill-card--column">
            <p>Smart Reminder<br />Stillness session in 2h — ${lowName} energy needs recovery.</p>
            <button class="pill-button el-earth" type="button" data-notice="schedule">Tap to schedule  →</button>
          </div>
          ${AppShell.divider()}
        </section>

        <section class="app-section app-section--tight" data-enter>
          ${AppShell.label(dayLabel)}
          <div class="habit-tiles">${tiles}</div>
        </section>
      `;
    }

    // Notifications behind the smart cards
    function notice(name) {
      const levels = weekLevels();
      const low = [...D.ELEMENTS].sort((a, b) => levels[a] - levels[b])[0];
      const notices = {
        balance: {
          title: "Balance Alert",
          text: `${AppShell.capital(low)} energy is at ${levels[low]}% this week. You've been giving more than you restore. ${AppShell.ADVICE[low]}`,
          icon: `assets/app/element-${low}-small.svg`,
          element: levels[low] < 50 ? "red" : low,
          tone: levels[low] < 50 ? "red" : "yellow",
        },
        location: {
          title: "You're near IKEA",
          text: "Things to pick up while you're there:",
          list: ["Candles", "Warm string lights", "A plant pot", "Visit the kitchenware section"],
          extra: "If you have time, also look at lids for your pots and pillowcases.",
          icon: "assets/app/element-metal-small.svg",
          element: "metal",
          duration: 7000,
        },
        schedule: {
          title: "Stillness session scheduled",
          text: "Today at 8:00 PM, 20 minutes. We'll remind you 10 minutes before.",
          icon: "assets/app/element-earth-small.svg",
          element: "earth",
          tone: "green",
        },
      };
      Notice.show(el, notices[name]);
    }

    function wireContent() {
      el.querySelectorAll("[data-notice]").forEach((item) => {
        item.addEventListener("click", () => notice(item.dataset.notice));
        item.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && notice(item.dataset.notice));
      });
      el.querySelectorAll(".habit-tile[data-habit]").forEach((tile) =>
        tile.addEventListener("click", () => D.toggleHabit(tile.dataset.habit, view.day))
      );
    }

    const onDay = (date) => {
      view.day = date;
      update();
    };

    function update() {
      AppShell.refresh(el, app, build(), { onDay });
      wireContent();
    }

    const el = AppShell.screen({ tab: "home", content: build() });
    AppShell.wire(el, app, { onDay });
    wireContent();
    app.onLeave(D.onChange(update));
    return el;
  },
};
