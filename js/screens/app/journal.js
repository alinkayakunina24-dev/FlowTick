// APP Journal ("State of Being") — Figma node 2942:33188
// A note and a mood, saved as an entry with date and time ("Save entry"); you can save
// several a day. The question changes with the day of the week. Past entries, the month
// of moods (‹ › to browse) and the year strip all come from the same AppData entries.

window.Screens = window.Screens || {};

window.Screens.journal = {
  render(app) {
    const D = AppData;
    const MOODS = [
      { id: "joy", label: "Joy", color: "yellow" },
      { id: "sad", label: "Sad", color: "water" },
      { id: "anger", label: "Anger", color: "red" },
      { id: "fear", label: "Fear", color: "air" },
      { id: "disgust", label: "Disgust", color: "earth" },
    ];
    const colorOf = (mood) => MOODS.find((m) => m.id === mood).color;
    const moodIcon = (mood, size = 12) => `<img src="assets/app/mood-${mood}.svg" alt="${mood}" width="${size}" height="${size}" />`;

    // One question and one quote per day of the week (Monday first)
    const PROMPTS = [
      "What do you want this week to feel like?",
      "What small win are you proud of today?",
      "What are you grateful for today?",
      "Who made your day a little brighter?",
      "What did you learn about yourself this week?",
      "What brought you joy today?",
      "What do you want to let go of before the new week?",
    ];
    const QUOTES = [
      "“Every beginning holds a quiet power.”",
      "“Small steps still move mountains.”",
      "“The soul speaks in whispers. Listen.”",
      "“We rise by lifting others.”",
      "“Know yourself, and you will know the way.”",
      "“Joy is found in the simplest moments.”",
      "“Rest is part of the journey.”",
    ];

    // The note being written is kept as a draft until it's saved
    const DRAFT = "shine.journal.draft";
    const draft = (() => {
      try {
        return JSON.parse(localStorage.getItem(DRAFT)) || {};
      } catch {
        return {};
      }
    })();
    const saveDraft = () => {
      try {
        localStorage.setItem(DRAFT, JSON.stringify(draft));
      } catch {
        // Storage blocked: keep it for this visit only
      }
    };

    const view = { month: 0 };

    // Smart insight: the weekday that most often brings a difficult mood (last 8 weeks)
    const HARD = { sad: "low", anger: "angry", fear: "anxious", disgust: "irritated" };
    const WEEKDAYS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
    function insight() {
      const stats = Array.from({ length: 7 }, () => ({ total: 0, hard: 0, moods: {} }));
      for (let i = 1; i <= 56; i++) {
        const date = D.addDays(D.today(), -i);
        D.entriesOn(date).forEach((e) => {
          const s = stats[D.weekday(date)];
          s.total += 1;
          if (HARD[e.mood]) {
            s.hard += 1;
            s.moods[e.mood] = (s.moods[e.mood] || 0) + 1;
          }
        });
      }
      let day = -1;
      stats.forEach((s, i) => {
        if (s.total >= 3 && s.hard / s.total >= 0.5 && (day < 0 || s.hard / s.total > stats[day].hard / stats[day].total)) day = i;
      });
      if (day < 0) {
        return { tone: "green", title: "Your weeks look balanced", text: "No weekday stands out with difficult moods lately. Keep noticing how you feel — it's working." };
      }
      const s = stats[day];
      const mood = Object.keys(s.moods).sort((a, b) => s.moods[b] - s.moods[a])[0];
      return {
        tone: "yellow",
        mood,
        title: `${WEEKDAYS[day]} feel heavier`,
        text: `We noticed that on ${WEEKDAYS[day].toLowerCase()} you often feel ${HARD[mood]} (${s.hard} of the last ${s.total} entries). Maybe there's a regular activity that day worth reviewing — or a little extra rest to plan in.`,
      };
    }

    const stamp = (iso) => {
      const d = new Date(iso);
      const date = d.toLocaleString("en", { month: "long", day: "numeric" });
      const time = d.toLocaleString("en", { hour: "numeric", minute: "2-digit" });
      return `${date} · ${time}`;
    };

    function build() {
      const t = D.today();
      const weekday = D.weekday(t);

      const entries = D.recentEntries(5).map((e) => `
        <div class="card entry">
          <p class="entry__head"><span>${stamp(e.at)}</span>${moodIcon(e.mood)}</p>
          ${AppShell.divider()}
          <p class="entry__text">${UI.escape(e.text || MOODS.find((m) => m.id === e.mood).label)}</p>
        </div>
      `).join("");

      // The month shown in the tracker
      const first = new Date(t.getFullYear(), t.getMonth() + view.month, 1);
      const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < D.weekday(first); i++) cells.push('<span class="mood-day mood-day--blank"></span>');
      for (let day = 1; day <= count; day++) {
        const date = new Date(first.getFullYear(), first.getMonth(), day);
        const mood = D.moodOn(date);
        cells.push(`
          <button class="mood-day${D.isToday(date) ? " mood-day--today" : ""}" type="button" data-day="${D.key(date)}" ${D.isFuture(date) ? "disabled" : ""}>
            <span class="mood-day__circle${mood ? ` mood--${colorOf(mood)}` : ""}">${mood ? moodIcon(mood, 18) : ""}</span>
            <span class="mood-day__number">${day}</span>
          </button>
        `);
      }

      // The year of that month: 53 weeks × 7 days
      const year = first.getFullYear();
      const yearStart = new Date(year, 0, 1);
      const startOffset = D.weekday(yearStart);
      const dots = [];
      for (let week = 0; week < 53; week++) {
        for (let wd = 0; wd < 7; wd++) {
          const date = new Date(year, 0, week * 7 + wd - startOffset + 1);
          if (date.getFullYear() !== year) continue;
          const mood = D.moodOn(date);
          const current = date.getMonth() === first.getMonth();
          dots.push(`<span class="year-dot${mood ? ` mood--${colorOf(mood)}` : ""}${current ? " is-current" : ""}" style="grid-area: ${wd + 1} / ${week + 1}"></span>`);
        }
      }
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

      return `
        ${AppShell.header({ title: "State of Being", subtitle: QUOTES[weekday] })}
        ${AppShell.weekStrip()}

        ${(() => {
          let hidden = null;
          try {
            hidden = localStorage.getItem("shine.insight.hidden");
          } catch {
            // Storage blocked: show it
          }
          if (hidden === D.key(t)) return "";
          const i = insight();
          return `
            <section class="insight insight--${i.tone}" data-enter>
              <span class="insight__icon">${i.mood ? moodIcon(i.mood, 14) : "✦"}</span>
              <span class="insight__text"><b>Smart insight · ${i.title}</b><br />${i.text}</span>
              <button class="insight__close" type="button" data-hide-insight aria-label="Hide for today">
                <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" stroke-linecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg>
              </button>
            </section>
          `;
        })()}

        <section class="app-section app-section--tight" data-enter>
          <p class="journal-prompt">${PROMPTS[weekday]}</p>
          <textarea class="gratitude el-air" rows="5" placeholder="Write a few words…" aria-label="${PROMPTS[weekday]}">${UI.escape(draft.text || "")}</textarea>
        </section>

        <section class="app-section app-section--tight" data-enter>
          <p class="hint hint--white">How are you feeling now?</p>
          <div class="moods" role="radiogroup" aria-label="Mood">
            ${MOODS.map((m) => `
              <button class="mood-tag mood--${m.color}" type="button" role="radio" data-mood="${m.id}"
                      aria-checked="${draft.mood === m.id}">${moodIcon(m.id)}<span>${m.label}</span></button>
            `).join("")}
          </div>
          <button class="btn-session journal-save" type="button" data-save ${draft.mood ? "" : "disabled"}>Save entry</button>
        </section>

        <section class="app-section app-section--tight" data-enter>
          ${AppShell.label("PAST ENTRIES")}
          <div class="entries">${entries}</div>
        </section>

        <section class="app-section app-section--tight" data-enter>
          ${AppShell.label("ENERGY TRACKER")}
          <div class="card mood-month">
            <p class="card__nav">
              <button type="button" data-shift="-1" aria-label="Previous month">‹</button>
              <span>${first.toLocaleString("en", { month: "long" })} ${year}</span>
              <button type="button" data-shift="1" aria-label="Next month" ${view.month >= 0 ? "disabled" : ""}>›</button>
            </p>
            ${AppShell.divider()}
            <div class="mood-month__grid">
              ${AppShell.DAYS.map((d) => `<span class="mood-month__weekday">${d}</span>`).join("")}
              ${cells.join("")}
            </div>
          </div>
        </section>

        <section class="year" data-enter>
          <div class="year__months">${months.map((m, i) => `<span${i === first.getMonth() ? ' class="is-current"' : ""}>${m}</span>`).join("")}</div>
          <div class="year__body">
            <div class="year__weekdays">${AppShell.DAYS.map((d) => `<span>${d}</span>`).join("")}</div>
            <div class="year__dots">${dots.join("")}</div>
          </div>
        </section>
      `;
    }

    function wireContent() {
      const hide = el.querySelector("[data-hide-insight]");
      if (hide) hide.addEventListener("click", () => {
        try {
          localStorage.setItem("shine.insight.hidden", D.key(D.today()));
        } catch {
          // Storage blocked: hide it for now only
        }
        const card = hide.closest(".insight");
        card.style.transition = "opacity 300ms, height 400ms, padding 400ms, margin 400ms";
        card.style.overflow = "hidden";
        card.style.height = `${card.offsetHeight}px`;
        requestAnimationFrame(() => Object.assign(card.style, { opacity: 0, height: "0px", paddingTop: "0px", paddingBottom: "0px", marginBottom: "-15px" }));
        setTimeout(() => card.remove(), 450);
      });
      const save = el.querySelector("[data-save]");
      el.querySelector(".gratitude").addEventListener("input", (e) => {
        draft.text = e.target.value;
        saveDraft();
      });
      el.querySelectorAll(".mood-tag").forEach((tag) =>
        tag.addEventListener("click", () => {
          draft.mood = tag.dataset.mood;
          saveDraft();
          el.querySelectorAll(".mood-tag").forEach((t) => t.setAttribute("aria-checked", String(t === tag)));
          save.disabled = false;
        })
      );
      save.addEventListener("click", () => {
        D.addEntry(draft.mood, (draft.text || "").trim());
        draft.text = "";
        draft.mood = null;
        saveDraft();
        Notice.show(el, {
          title: "Entry saved",
          text: `Your ${new Date().toLocaleString("en", { hour: "numeric", minute: "2-digit" })} entry is in your journal.`,
          icon: "assets/app/element-water-small.svg",
          element: "earth",
          tone: "green",
        });
      });
      el.querySelectorAll("[data-shift]").forEach((b) =>
        b.addEventListener("click", () => {
          view.month = Math.min(0, view.month + Number(b.dataset.shift));
          update();
        })
      );
      // Tapping a day shows what was written that day
      el.querySelectorAll(".mood-day[data-day]").forEach((cell) =>
        cell.addEventListener("click", () => {
          const date = D.fromKey(cell.dataset.day);
          const list = D.entriesOn(date);
          Notice.show(el, {
            title: date.toLocaleString("en", { weekday: "long", month: "long", day: "numeric" }),
            text: list.length ? "" : "No entries this day.",
            list: list.map((e) => `${new Date(e.at).toLocaleString("en", { hour: "numeric", minute: "2-digit" })} · ${MOODS.find((m) => m.id === e.mood).label}${e.text ? ` — ${UI.escape(e.text)}` : ""}`),
            icon: list.length ? `assets/app/mood-${list[0].mood}.svg` : "assets/app/element-water-small.svg",
            duration: 6000,
          });
        })
      );
    }

    function update() {
      AppShell.refresh(el, app, build());
      wireContent();
    }

    const el = AppShell.screen({ tab: "journal", content: build() });
    AppShell.wire(el, app);
    wireContent();
    app.onLeave(D.onChange(update));
    return el;
  },
};
