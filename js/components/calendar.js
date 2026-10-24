// Calendar — a glass panel that drops from the top when the calendar icon is tapped.
// A plain month calendar: ‹ › (or swipe) change the month, today is highlighted,
// coloured dots show the mood of past days, white dots mark planned days ahead.
// Tapping a day opens its plan (the everyday routine) underneath;
// tapping it again closes it. Tap outside, the icon again or Esc to close.

window.Calendar = (function () {
  const MOOD_COLORS = { joy: "yellow", sad: "water", anger: "red", fear: "air", disgust: "earth" };
  const MOOD_NAMES = { joy: "Joy", sad: "Sad", anger: "Anger", fear: "Fear", disgust: "Disgust" };
  const MONTHS = Array.from({ length: 12 }, (_, m) => new Date(2000, m, 1).toLocaleString("en", { month: "long" }));

  // Everyday routine by weekday (0 = Monday). Colours follow the elements:
  // earth — work & chores, air — people, water — calm, fire — active, metal — errands.
  const ROUTINE = [
    [
      { time: "9:00 AM", title: "Work — weekly team meeting", el: "earth" },
      { time: "1:00 PM", title: "Lunch with a colleague", el: "air" },
      { time: "7:30 PM", title: "Call mom", el: "water" },
    ],
    [
      { time: "9:00 AM", title: "Work", el: "earth" },
      { time: "6:30 PM", title: "Yoga class", el: "fire" },
      { time: "8:00 PM", title: "Grocery shopping", el: "metal" },
    ],
    [
      { time: "9:00 AM", title: "Work", el: "earth" },
      { time: "5:00 PM", title: "Coffee at the café on the corner", el: "air" },
      { time: "9:00 PM", title: "Read before bed", el: "water" },
    ],
    [
      { time: "9:00 AM", title: "Work — project review", el: "earth" },
      { time: "12:30 PM", title: "Pick up a parcel at the post office", el: "metal" },
      { time: "7:00 PM", title: "Call a friend", el: "air" },
    ],
    [
      { time: "9:00 AM", title: "Work", el: "earth" },
      { time: "6:00 PM", title: "Pharmacy & drugstore", el: "metal" },
      { time: "8:00 PM", title: "Movie night at home", el: "water" },
    ],
    [
      { time: "11:00 AM", title: "Brunch with friends", el: "air" },
      { time: "2:00 PM", title: "Shopping in town", el: "metal" },
      { time: "6:00 PM", title: "Dinner at the café with the girls", el: "fire" },
    ],
    [
      { time: "10:00 AM", title: "Clean the apartment", el: "earth" },
      { time: "1:00 PM", title: "Visit mom", el: "water" },
      { time: "7:00 PM", title: "Plan the week ahead", el: "metal" },
    ],
  ];

  const plansFor = (date) => ROUTINE[(date.getDay() + 6) % 7];

  const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
  let current = null;

  function open(screen) {
    // The icon toggles the calendar
    if (current) return current.close();

    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    let selected = null;

    const el = document.createElement("div");
    el.className = "calendar";
    el.innerHTML = `
      <div class="calendar__outside"></div>
      <div class="calendar__panel glass-panel" role="dialog" aria-label="Calendar">
        <div class="calendar__nav">
          <button type="button" data-action="prev" aria-label="Previous month">‹</button>
          <h2 class="calendar__title"></h2>
          <button type="button" data-action="next" aria-label="Next month">›</button>
        </div>
        <div class="calendar__weekdays">${AppShell.DAYS.map((d) => `<span>${d}</span>`).join("")}</div>
        <div class="calendar__grid"></div>
        <div class="calendar__details" hidden></div>
      </div>
    `;

    const panel = el.querySelector(".calendar__panel");
    const title = el.querySelector(".calendar__title");
    const grid = el.querySelector(".calendar__grid");
    const details = el.querySelector(".calendar__details");

    function renderMonth() {
      title.innerHTML = `${MONTHS[month]} <span>${year}</span>`;
      const offset = (new Date(year, month, 1).getDay() + 6) % 7;
      const count = new Date(year, month + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < offset; i++) cells.push('<span class="cal-day cal-day--blank"></span>');
      for (let d = 1; d <= count; d++) {
        const date = new Date(year, month, d);
        const mood = AppShell.moodOn(date);
        const classes = ["cal-day"];
        if (sameDay(date, today)) classes.push("is-today");
        if (sameDay(date, selected)) classes.push("is-selected");
        const future = date > today && !sameDay(date, today);
        if (future) classes.push("is-future");
        cells.push(`
          <button class="${classes.join(" ")}" type="button" data-day="${d}" aria-label="${date.toDateString()}">
            <span>${d}</span>
            ${mood ? `<i class="cal-day__dot mood--${MOOD_COLORS[mood]}"></i>` : ""}
            ${future ? '<i class="cal-day__dot cal-day__dot--plan"></i>' : ""}
          </button>
        `);
      }
      grid.innerHTML = cells.join("");
    }

    function renderDetails() {
      if (!selected) {
        details.hidden = true;
        return;
      }
      const mood = AppShell.moodOn(selected);
      const items = [];
      if (mood) {
        items.push(`
          <li class="cal-item">
            <img src="assets/app/mood-${mood}.svg" alt="" width="18" height="18" />
            <span>Mood: ${MOOD_NAMES[mood]}</span>
          </li>
        `);
      }
      // Tasks from the Dashboard for that day, then the everyday routine (not for today)
      const time12 = (t) => {
        const [h, m] = t.split(":").map(Number);
        return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
      };
      const tasks = AppData.tasks()
        .filter((t) => t.date === AppData.key(selected))
        .map((t) => ({ time: t.time ? time12(t.time) : "Any time", title: `${t.done ? "✓ " : ""}${UI.escape(t.title)}`, el: t.element }));
      const plans = sameDay(selected, today) ? tasks : [...tasks, ...plansFor(selected)];
      plans.forEach((p) => items.push(`
        <li class="cal-item el-${p.el}">
          <span class="cal-item__bar"></span>
          <span class="cal-item__time">${p.time}</span>
          <span>${p.title}</span>
        </li>
      `));
      details.innerHTML = `
        <div class="divider"></div>
        <p class="calendar__day-title">${selected.toLocaleString("en", { weekday: "long", day: "numeric", month: "long" })}</p>
        <ul class="calendar__items">${items.join("")}</ul>
      `;
      details.hidden = false;
      details.animate(
        [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 450, easing: "cubic-bezier(0.37, 0, 0.63, 1)" }
      );
    }

    function shift(step) {
      month += step;
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
      renderMonth();
    }

    function close() {
      if (el.classList.contains("calendar--closing")) return;
      current = null;
      document.removeEventListener("keydown", onKey);
      el.classList.add("calendar--closing");
      panel.addEventListener("animationend", () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 600);
    }

    el.querySelector(".calendar__outside").addEventListener("click", close);
    panel.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action], [data-day]");
      if (!target) return;
      if (target.dataset.action === "prev") return shift(-1);
      if (target.dataset.action === "next") return shift(1);
      const date = new Date(year, month, Number(target.dataset.day));
      selected = sameDay(date, selected) ? null : date;
      renderMonth();
      renderDetails();
    });
    UI.onGesture(grid, { next: () => shift(1), prev: () => shift(-1) });

    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);

    renderMonth();
    screen.appendChild(el);
    current = { close };
  }

  return { open };
})();
