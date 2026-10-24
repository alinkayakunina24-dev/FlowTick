// APP Analytics ("Weekly Radiance") — Figma node 2938:5283
// Everything here is calculated from AppData for the chosen period:
//   Day / Week / Month / Year tabs pick the period, ‹ › on the Energy Tracker move it back
//   and forth. The radar, elemental balance, energy bars, focus chart and stat cards all
//   follow. Marking a habit day changes every number on the page (and on other screens).
//   Tapping a habit card opens it: instructions, why it helps, and settings.

window.Screens = window.Screens || {};

(function () {
  const D = () => AppData;
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const upper = (d) => `${MONTHS_SHORT[d.getMonth()].toUpperCase()} ${d.getDate()}`;

  // ---------- Periods ----------

  // The date range of a period, its buckets (bars / chart points) and labels
  function range(period, offset) {
    const t = D().today();
    const add = D().addDays;

    if (period === "day") {
      const day = add(t, offset);
      const slots = [6, 9, 12, 15, 18, 21];
      const now = new Date().getHours();
      return {
        from: day,
        to: day,
        label: upper(day),
        title: offset === 0 ? "Today" : offset === -1 ? "Yesterday" : day.toLocaleString("en", { weekday: "short", month: "short", day: "numeric" }),
        buckets: slots.map((h, i) => ({
          label: h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`,
          from: day,
          to: day,
          share: 0.6 + D().seeded(`slot|${D().key(day)}|${i}`) * 0.8,
          future: D().isFuture(day) || (D().isToday(day) && h > now),
        })),
      };
    }

    if (period === "week") {
      const monday = add(t, -D().weekday(t) + offset * 7);
      const sunday = add(monday, 6);
      return {
        from: monday,
        to: sunday,
        label: `${upper(monday)} — ${upper(sunday)}`,
        title: offset === 0 ? "This Week" : offset === -1 ? "Last Week" : `${upper(monday)} – ${upper(sunday)}`,
        buckets: AppShell.DAYS.map((name, i) => {
          const day = add(monday, i);
          return { label: name, date: day.getDate(), from: day, to: day, future: D().isFuture(day) };
        }),
      };
    }

    if (period === "month") {
      const first = new Date(t.getFullYear(), t.getMonth() + offset, 1);
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
      const buckets = [];
      for (let start = 1, n = 1; start <= last.getDate(); start += 7, n++) {
        const from = new Date(first.getFullYear(), first.getMonth(), start);
        const to = new Date(first.getFullYear(), first.getMonth(), Math.min(start + 6, last.getDate()));
        buckets.push({ label: `W${n}`, from, to, future: D().isFuture(from) });
      }
      const name = first.toLocaleString("en", { month: "long" });
      return { from: first, to: last, label: `${name.toUpperCase()} ${first.getFullYear()}`, title: `${name} ${first.getFullYear()}`, buckets };
    }

    const year = t.getFullYear() + offset;
    return {
      from: new Date(year, 0, 1),
      to: new Date(year, 11, 31),
      label: String(year),
      title: String(year),
      buckets: MONTHS_SHORT.map((m, i) => {
        const from = new Date(year, i, 1);
        return { label: m, from, to: new Date(year, i + 1, 0), future: D().isFuture(from) };
      }),
    };
  }

  // Energy and focus of every bucket
  function measure(r) {
    return r.buckets.map((b) => {
      if (b.future) return { ...b, energy: null, focus: 0 };
      const energy = D().rangeEnergy(b.from, b.to);
      const focus = D().rangeFocus(b.from, b.to);
      // A day is split into time slots: each slot gets a share of the day
      if (b.share) return { ...b, energy: Math.min(100, Math.round(energy * b.share)), focus: Math.round((focus / 6) * b.share) };
      return { ...b, energy, focus };
    });
  }

  const percentChange = (now, before) => (before ? Math.round(((now - before) / before) * 1000) / 10 : 0);
  const signed = (n) => `${n > 0 ? "+" : ""}${n}`;

  // ---------- Radar ----------

  // The little four-bar chart on the stat cards (Card_Chart_Icon), coloured by the theme
  const CHART_BARS = ["M0 14a2 2 0 0 1 4 0v4a2 2 0 0 1-4 0Z", "M8 10a2 2 0 0 1 4 0v8a2 2 0 0 1-4 0Z",
    "M16 6a2 2 0 0 1 4 0v12a2 2 0 0 1-4 0Z", "M24 2a2 2 0 0 1 4 0v16a2 2 0 0 1-4 0Z"].map((d) => `<path d="${d}"/>`).join("");

  // Pentagon corners of radar-axis.svg (in the 309×307 chart box) and its centre
  const CENTER = [153, 158];
  const CORNERS = { metal: [154, 4], earth: [302, 120], fire: [250, 299], water: [58, 299], air: [6, 120] };
  const ORDER = ["metal", "earth", "fire", "water", "air"];
  const GRADIENT = {
    water: ["#35ABEB", "#0E4385"],
    air: ["#947CE3", "#4D38CC"],
    metal: ["#B9B9D7", "#434365"],
    earth: ["#56C079", "#134D28"],
    fire: ["#EE762A", "#6C2206"],
  };

  function radar(levels) {
    const point = (el) => {
      const k = 0.15 + 0.85 * (levels[el] / 100);
      const [x, y] = CORNERS[el];
      return [CENTER[0] + (x - CENTER[0]) * k, CENTER[1] + (y - CENTER[1]) * k];
    };
    const pts = ORDER.map(point);
    const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

    const defs = ORDER.map((el) => `
      <linearGradient id="radar-${el}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.42" style="stop-color: var(--gradient-${el}-start, ${GRADIENT[el][0]})"/><stop offset="1" style="stop-color: var(--gradient-${el}-end, ${GRADIENT[el][1]})"/>
      </linearGradient>`).join("");

    // As in the design: one triangle per element, from its corner to the next one,
    // filled with that element's own gradient
    const wedges = ORDER.map((el, i) => {
      const next = pts[(i + 1) % ORDER.length];
      return `<path d="M${f(CENTER)} L${f(pts[i])} L${f(next)} Z" fill="url(#radar-${el})" style="fill-opacity: var(--radar-wedge, 0.45)"/>`;
    }).join("");
    const outline = `<path d="M${pts.map(f).join(" L")} Z" stroke="white" stroke-opacity="0.6" stroke-width="0.75" fill="none"/>`;
    const spokes = pts.map((p) => `<path d="M${f(CENTER)} L${f(p)}" stroke="white" stroke-opacity="0.35" stroke-width="0.75"/>`).join("");

    const planets = ORDER.map((el, i) => `
      <span class="radar__planet planet el-${el}" style="left: ${pts[i][0]}px; top: ${pts[i][1]}px"></span>
    `).join("");

    return `
      <div class="radar__chart">
        <img class="radar__mandala" src="assets/images/mandala-sun.png" alt="" />
        <svg class="radar__axis" width="296" height="295" viewBox="0 0 296 295" aria-hidden="true">
          <path d="M148 0C148 0 238.202 70.6992 296 116C275.613 185.885 243.795 294.951 243.795 294.951H52.2047C52.2047 294.951 20.3872 185.885 0 116C57.7976 70.6992 148 0 148 0Z" fill="var(--radar-plate, rgba(5, 6, 17, 0.3))" />
        </svg>
        <svg class="radar__shape" width="309" height="307" viewBox="0 0 309 307" fill="none" role="img"
             aria-label="${ORDER.map((el) => `${el} ${levels[el]}%`).join(", ")}">
          <defs>${defs}</defs>
          <g class="radar__morph">${wedges}${spokes}${outline}</g>
        </svg>
        ${planets}
        <span class="radar__center"></span>
      </div>
    `;
  }

  // ---------- Focus chart ----------

  function focusChart(now, before, labels) {
    const W = 316;
    const left = 22;
    const right = 310;
    const top = 14;
    const bottom = 96;
    const max = Math.max(60, ...now, ...before);
    const n = labels.length;
    const x = (i) => left + (n === 1 ? 0 : (i * (right - left)) / (n - 1));
    const y = (v) => bottom - (v / max) * (bottom - top);
    const curve = (vals) => vals.map((v, i) => {
      if (i === 0) return `M${x(0).toFixed(1)} ${y(v).toFixed(1)}`;
      const cx = ((x(i - 1) + x(i)) / 2).toFixed(1);
      return `C${cx} ${y(vals[i - 1]).toFixed(1)} ${cx} ${y(v).toFixed(1)} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
    }).join(" ");
    const area = (vals) => `${curve(vals)} L${x(vals.length - 1).toFixed(1)} ${bottom} L${x(0).toFixed(1)} ${bottom} Z`;
    const hours = (v) => (v >= 60 ? `${Math.round(v / 60)}h` : `${Math.round(v)}m`);
    const ticks = [max, (max * 2) / 3, max / 3, 0].map((v, i) => `<text x="0" y="${top + 3 + i * ((bottom - top) / 3)}">${hours(v)}</text>`).join("");
    const peak = now.indexOf(Math.max(...now));

    return `
      <svg class="sessions__chart" width="${W}" height="108" viewBox="0 0 ${W} 108" fill="none" role="img"
           aria-label="Focus time this period compared to the previous one">
        <g font-family="Caudex, Georgia, serif" font-size="7" fill="white" opacity="0.8">${ticks}</g>
        <path d="${area(before)}" style="fill: var(--gradient-water-start, #35ABEB)" fill-opacity="0.15"/>
        <path d="${curve(before)}" style="stroke: var(--gradient-water-start, #35ABEB)" stroke-width="1.2"/>
        ${now.length ? `<path d="${area(now)}" fill="url(#focus-area)"/><path d="${curve(now)}" style="stroke: var(--gradient-air-start, #947CE3)" stroke-width="2"/>` : ""}
        ${now.map((v, i) => `<circle class="chart-planet" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === peak ? 3 : 2}" style="fill: var(--gradient-air-start, #947CE3)"${i === peak ? ' stroke="white"' : ""}/>`).join("")}
        <defs>
          <linearGradient id="focus-area" x1="0" y1="${top}" x2="0" y2="${bottom + 10}" gradientUnits="userSpaceOnUse">
            <stop style="stop-color: var(--gradient-air-start, #6B4DF2)" stop-opacity="0.55"/><stop offset="0.5" style="stop-color: var(--gradient-air-start, #6147E0)" stop-opacity="0.28"/><stop offset="1" style="stop-color: var(--gradient-air-end, #4D38CC)" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
      </svg>
      <div class="sessions__days">${labels.map((l) => `<span>${l}</span>`).join("")}</div>
    `;
  }

  // ---------- Habit card ----------

  const scheduleLabel = (days) =>
    days.length === 7 ? "Everyday" : days.join() === "0,1,2,3,4" ? "Weekdays" : `${days.length} days per week`;

  const time12 = (t) => {
    const [h, m] = t.split(":").map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  function habitCard(h, weekStart, expanded) {
    const days = AppShell.DAYS.map((name, i) => {
      const date = D().addDays(weekStart, i);
      if (D().isFuture(date)) {
        return `
          <button class="habit-day is-future" type="button" aria-pressed="false" disabled>
            <span class="el-icon el-icon--small"></span><span>${name}</span>
          </button>`;
      }
      const on = D().isDone(h.id, date);
      return `
        <button class="habit-day" type="button" data-habit="${h.id}" data-date="${D().key(date)}" aria-pressed="${on}"
                aria-label="${h.title}, ${date.toDateString()}">
          <span class="el-icon el-icon--small"><img src="assets/app/check-${on ? "active" : "passive"}.svg" alt="" width="16" height="16" /></span>
          <span>${name}</span>
        </button>`;
    }).join("");

    const details = !expanded ? "" : `
      <div class="habit-card__details">
        <div class="habit-card__block">
          <p class="section-label">PRACTICE</p>
          <div class="chips">
            ${D().PRACTICES[h.element].map((p, i) => `
              <button class="chip" type="button" data-practice="${i}" aria-pressed="${i === h.practice}">${p.title}</button>
            `).join("")}
          </div>
        </div>
        <div class="habit-card__block">
          <p class="section-label">WHY IT HELPS</p>
          <p>${h.why}</p>
        </div>
        <div class="habit-card__block">
          <p class="section-label">HOW TO DO IT</p>
          <ol class="habit-card__steps">${h.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
        </div>
        <div class="habit-card__block habit-card__row">
          <p class="section-label">TIME</p>
          <input class="time-field" type="time" value="${h.time}" aria-label="Time" />
        </div>
        <div class="habit-card__block">
          <p class="section-label">DAYS</p>
          <div class="chips chips--days">
            ${AppShell.DAYS.map((d, i) => `
              <button class="chip chip--day" type="button" data-weekday="${i}" aria-pressed="${h.days.includes(i)}">${d}</button>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    return `
      <div class="habit-card el-${h.element}${expanded ? " is-open" : ""}" data-card="${h.id}">
        <button class="habit-card__head" type="button" aria-expanded="${expanded}">
          <span class="habit-card__title">
            <span class="el-icon"><img src="assets/app/element-${h.element}-small.svg" alt="" /></span>
            <span>${h.title}<br />${AppShell.capital(h.element)} · ${h.intention} · ${time12(h.time)}</span>
          </span>
          <span class="el-badge">${scheduleLabel(h.days)}</span>
        </button>
        ${details}
        ${AppShell.divider()}
        <div class="habit-card__days">${days}</div>
      </div>
    `;
  }

  // ---------- Advisory ----------

  const ACTIONS = {
    water: { label: "Start Stillness Now", screen: "timer", params: { mode: "rest" } },
    air: { label: "Start Breath Work", screen: "breathing" },
    metal: { label: "Start Silence Mode", screen: "blocker" },
    earth: { label: "Play Nature Sounds", screen: "sounds" },
    fire: { label: "Start a Focus Timer", screen: "timer", params: { mode: "focus" } },
  };

  function advisory(levels) {
    const sorted = [...AppData.ELEMENTS].sort((a, b) => levels[b] - levels[a]);
    const [best, second] = sorted;
    const low = sorted[sorted.length - 1];
    const cap = AppShell.capital;
    return `
      <div class="card advisory">
        <p>Balance Advisory</p>
        ${AppShell.divider()}
        <p>Your ${cap(best)} and ${cap(second)} energy is exceptional, ${AppShell.userName()}. However, your ${cap(low)} reserves are low (${levels[low]}%). ${AppShell.ADVICE[low]}</p>
        <button class="el-badge el-air advisory__go" type="button" data-advice="${low}">${ACTIONS[low].label}  →</button>
      </div>
    `;
  }

  // ---------- Screen ----------

  window.Screens.analytics = {
    render(app) {
      const view = { period: "week", offset: 0, open: null };

      function build() {
        const r = range(view.period, view.offset);
        const fullPrev = range(view.period, view.offset - 1);
        // Compare like with like: if this period is still going, take the same
        // number of days from the start of the previous one
        const elapsed = Math.round(((D().isFuture(r.to) ? D().today() : r.to) - r.from) / D().DAY);
        const prevTo = D().addDays(fullPrev.from, elapsed);
        const prev = { ...fullPrev, to: prevTo < fullPrev.to ? prevTo : fullPrev.to };
        const levels = D().elementLevels(r.from, r.to);
        const prevLevels = D().elementLevels(prev.from, prev.to);
        const buckets = measure(r);
        const prevBuckets = measure(fullPrev);
        const past = buckets.filter((b) => !b.future);
        const peak = past.length ? past.reduce((best, b) => (b.energy > best.energy ? b : best), past[0]) : null;

        const focusNow = D().rangeFocus(r.from, r.to);
        const focusBefore = D().rangeFocus(prev.from, prev.to);
        const rituals = D().rangeRituals(r.from, r.to);
        const breaks = D().rangeBreaks(r.from, r.to);
        const streak = D().streak(r.to);

        const periods = ["day", "week", "month", "year"].map((p) => `
          <button class="period-tabs__item" type="button" data-period="${p}" aria-pressed="${p === view.period}">${AppShell.capital(p)}</button>
        `).join("");

        // Bars fill the card: the most energized one is the tallest
        const top = Math.max(1, ...past.map((b) => b.energy));
        const bars = buckets.map((b) => `
          <span class="energy-day${b.future ? " is-future" : ""}" aria-pressed="${b === peak}"
                style="--h: ${b.future ? 4 : Math.max(10, Math.round((b.energy / top) * 96))}px" title="${b.future ? "" : `${b.energy}% energy`}">
            <span class="energy-day__date">${b === peak ? `${b.energy}%` : ""}</span>
            <span class="energy-day__bar"></span>
            <span class="energy-day__label">${b.label}</span>
            <span class="energy-day__dot"></span>
          </span>
        `).join("");

        const stats = [
          { value: AppShell.formatMinutes(focusNow), icon: "timer-dot", label: "Total Focus", delta: percentChange(focusNow, focusBefore) },
          { value: String(rituals), icon: "timer-skip", label: "Rituals Done", delta: percentChange(rituals, D().rangeRituals(prev.from, prev.to)) },
          { value: String(breaks), icon: "timer-stop", label: "Breaks Taken", delta: percentChange(breaks, D().rangeBreaks(prev.from, prev.to)) },
          { value: `${streak} days`, icon: "timer-reset", label: "Current Streak", delta: null },
        ].map((s) => {
          const up = s.delta === null || s.delta >= 0;
          return `
            <div class="card stat-card">
              <div class="stat-card__top">
                <span class="stat-card__metric">
                  <span class="stat-card__value"><img src="assets/app/${s.icon}.svg" alt="" />${s.value}</span>
                  <span class="stat-card__label">${s.label}</span>
                </span>
                ${s.delta === null ? "" : `<span class="tag tag--badge tag--${up ? "earth" : "red"}">${signed(s.delta)}%</span>`}
              </div>
              <svg class="stat-card__chart" width="28" height="20" viewBox="0 0 28 20" aria-hidden="true"
                 style="fill: ${up ? "#56C079" : "var(--utility-red-light)"}">${CHART_BARS}</svg>
            </div>
          `;
        }).join("");

        const weekEnd = D().isFuture(r.to) ? D().today() : r.to;
        const weekStart = D().addDays(weekEnd, -D().weekday(weekEnd));
        const habits = D().habits().map((h) => habitCard(h, weekStart, view.open === h.id)).join("");

        return `
          ${AppShell.header({ title: "Weekly Radiance", subtitle: "Analysis of your energy and focus." })}

          <section class="app-section app-section--tight" data-enter>
            <div class="period-tabs" role="group" aria-label="Period">${periods}</div>
            <p class="section-label section-label--center">${r.label}</p>
            ${AppShell.divider()}
          </section>

          <section class="radar" data-enter>
            ${radar(levels)}
            ${AppShell.divider()}
          </section>

          <section class="app-section" data-enter>
            ${advisory(levels)}
            <p class="hint">AI insight based on your elemental levels. Follow the recommendation to restore harmony.</p>
            ${AppShell.divider()}
          </section>

          <section class="app-section app-section--tight" data-enter>
            ${AppShell.label(`ELEMENTAL BALANCE · NOW AND CHANGE VS ${{ day: "DAY BEFORE", week: "LAST WEEK", month: "LAST MONTH", year: "LAST YEAR" }[view.period]}`)}
            ${AppShell.balanceCard(levels, (el, value) => {
              const change = value - prevLevels[el];
              const periodName = { day: "the day before", week: "last week", month: "last month", year: "last year" }[view.period];
              return { tag: `${signed(change)}%`, tone: change > 0 ? "earth" : change < 0 ? "red" : "yellow", change, period: periodName };
            })}
            <p class="hint">${AppShell.balanceTip(levels)}</p>
            ${AppShell.divider()}
          </section>

          <section class="app-section app-section--tight" data-enter>
            ${AppShell.label("ENERGY TRACKER")}
            <div class="card energy">
              <p class="card__nav">
                <button type="button" data-shift="-1" aria-label="Previous">‹</button>
                <span>${r.title}</span>
                <button type="button" data-shift="1" aria-label="Next" ${view.offset >= 0 ? "disabled" : ""}>›</button>
              </p>
              ${AppShell.divider()}
              <div class="energy__days energy__days--${view.period}">${bars}</div>
            </div>
            <p class="hint">${peak ? `Peak: ${peak.label}${peak.date ? ` ${peak.date}` : ""} — your most energized ${view.period === "day" ? "time" : view.period === "year" ? "month" : view.period === "month" ? "week" : "day"} (${peak.energy}%).` : "This period hasn't started yet."}</p>
            ${AppShell.divider()}
          </section>

          <section class="app-section app-section--tight" data-enter>
            ${AppShell.label("FOCUS SESSIONS")}
            <div class="card sessions">
              <div class="sessions__badges">
                <span class="el-badge el-${focusNow >= focusBefore ? "earth" : "red"}">${signed(percentChange(focusNow, focusBefore))}%</span>
                <span class="el-badge el-water">Total focus ${AppShell.formatMinutes(focusNow)}</span>
              </div>
              ${focusChart(past.map((b) => b.focus), prevBuckets.map((b) => b.focus), buckets.map((b) => b.label))}
              <div class="sessions__legend">
                <span class="legend legend--air">This ${view.period}</span>
                <span class="legend legend--water">Previous ${view.period}</span>
              </div>
            </div>
          </section>

          <section class="stat-cards" data-enter>${stats}</section>

          <section class="habit-cards" data-enter>${habits}</section>
        `;
      }

      function wireContent() {
        el.querySelectorAll("[data-period]").forEach((b) =>
          b.addEventListener("click", () => {
            view.period = b.dataset.period;
            view.offset = 0;
            update();
          })
        );
        el.querySelectorAll("[data-shift]").forEach((b) =>
          b.addEventListener("click", () => {
            view.offset = Math.min(0, view.offset + Number(b.dataset.shift));
            update();
          })
        );
        el.querySelector("[data-advice]").addEventListener("click", (e) => {
          const action = ACTIONS[e.currentTarget.dataset.advice];
          app.go(action.screen, { transition: "fade", duration: 900, params: action.params });
        });
        el.querySelectorAll(".habit-day[data-habit]").forEach((b) =>
          b.addEventListener("click", () => D().toggleHabit(b.dataset.habit, D().fromKey(b.dataset.date)))
        );
        el.querySelectorAll("[data-card]").forEach((card) => {
          const id = card.dataset.card;
          card.querySelector(".habit-card__head").addEventListener("click", () => {
            view.open = view.open === id ? null : id;
            update();
          });
          card.querySelectorAll("[data-practice]").forEach((b) =>
            b.addEventListener("click", () => D().updateHabit(id, { practice: Number(b.dataset.practice) }))
          );
          card.querySelectorAll("[data-weekday]").forEach((b) =>
            b.addEventListener("click", () => {
              const day = Number(b.dataset.weekday);
              const current = D().habit(id).days;
              const days = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
              if (days.length) D().updateHabit(id, { days });
            })
          );
          const time = card.querySelector(".time-field");
          if (time) time.addEventListener("change", () => time.value && D().updateHabit(id, { time: time.value }));
        });
      }

      function update() {
        AppShell.refresh(el, app, build());
        wireContent();
      }

      const el = AppShell.screen({ tab: "analytics", content: build() });
      AppShell.wire(el, app);
      wireContent();

      // Any change to the data (here or on another screen) redraws the page
      app.onLeave(D().onChange(update));
      return el;
    },
  };
})();
