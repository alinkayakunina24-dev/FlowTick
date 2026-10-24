// Focus session screens (Figma row "Focus Mode", nodes 2942:33203 … 2942:33263):
//   timer     — Pomodoro timer (params.mode "focus") or a rest / Stillness timer ("rest");
//               params.minutes sets the length (e.g. "focus the remaining time")
//   blocker   — Silence Mode: a quiet countdown with distractions silenced
//   breathing — Breath Work: the orb grows and shrinks with the chosen pattern
//   sounds    — Nature Sounds gallery: pick a scene
//   player    — the scene full-screen with its sound and a timer
// Tapping the time opens a picker (wheels or typing). Rings move smoothly every frame.
// Finished (or ended early) sessions are saved to AppData, so Analytics counts them.

window.Screens = window.Screens || {};

(function () {
  const pad = (n) => String(n).padStart(2, "0");
  const clock = (s) => (s >= 3600 ? `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`);

  const ICONS = {
    back: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>`,
    play: `<svg width="13" height="15" viewBox="0 0 13 15" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M12 6.6L2.5.9C1.7.4 1 .9 1 1.8v11.4c0 .9.7 1.4 1.5.9L12 8.4a1 1 0 000-1.8z"/></svg>`,
    pause: `<svg width="13" height="15" viewBox="0 0 13 15" fill="none" stroke="currentColor"><rect x=".5" y=".5" width="4" height="14" rx="1.5"/><rect x="8.5" y=".5" width="4" height="14" rx="1.5"/></svg>`,
    sound: `<svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5h3l4-3.5v11L4 9H1z"/><path d="M11 4.5a3.5 3.5 0 010 5M13 2.5a6 6 0 010 9"/></svg>`,
    muted: `<svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5h3l4-3.5v11L4 9H1z"/><path d="M11 5l4 4M15 5l-4 4"/></svg>`,
  };

  // ---------- Shared layout ----------

  // Back button, title, calendar icon; the content; the main button and "End early"
  function layout({ id, title, content, action, link = "End early", background }) {
    const el = document.createElement("section");
    el.className = `screen focus-screen focus-screen--${id}`;
    if (background) el.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.4)), url("${background}")`;
    el.innerHTML = `
      ${background ? "" : '<div class="mandala-deco" data-spin="240" data-transition="static"></div>'}
      <div class="focus-screen__inner">
        <header class="focus-head" data-enter>
          <button class="icon-square" type="button" data-back aria-label="Back">${ICONS.back}</button>
          <h1 class="focus-head__title${title.length > 13 ? " focus-head__title--long" : ""}">${title}</h1>
          <button class="app-header__calendar" type="button" aria-label="Calendar">
            ${AppShell.CALENDAR_ICON}
          </button>
        </header>
        <div class="focus-screen__body">${content}</div>
        <div class="focus-screen__actions" data-enter>
          <button class="btn-session" type="button" data-main>${action}</button>
          ${link ? `<button class="btn-link" type="button" data-end>${link}</button>` : ""}
        </div>
      </div>
    `;
    return el;
  }

  function wireLayout(el, app, { back = "focus" } = {}) {
    el.querySelector("[data-back]").addEventListener("click", () => app.go(back, { transition: "fade", duration: 800 }));
    el.querySelector(".app-header__calendar").addEventListener("click", () => Calendar.open(el));
  }

  // A countdown measured against the clock, so it never drifts.
  // onTick(secondsLeft, total) once a second; fraction() gives the exact progress any time.
  function countdown(seconds, { onTick, onDone }) {
    let total = seconds;
    let left = seconds * 1000; // milliseconds left while paused
    let endAt = 0;
    let timer = null;
    let lastShown = seconds;

    const remaining = () => (timer ? Math.max(0, endAt - performance.now()) : left);
    const tick = () => {
      const ms = remaining();
      const shown = Math.ceil(ms / 1000);
      if (shown !== lastShown) {
        lastShown = shown;
        onTick(shown, total);
      }
      if (ms <= 0) {
        stop();
        left = 0;
        onDone();
      }
    };
    function stop() {
      if (timer) left = remaining();
      clearInterval(timer);
      timer = null;
    }
    return {
      start() {
        if (timer || left <= 0) return;
        endAt = performance.now() + left;
        timer = setInterval(tick, 200);
      },
      pause: stop,
      stop,
      running: () => Boolean(timer),
      elapsed: () => Math.floor((total * 1000 - remaining()) / 1000),
      fraction: () => 1 - remaining() / (total * 1000),
      total: () => total,
      reset(next = total) {
        stop();
        total = next;
        left = next * 1000;
        lastShown = next;
        onTick(next, total);
      },
    };
  }

  // Redraw something every animation frame while the screen is open (smooth rings)
  function everyFrame(app, draw) {
    let id = 0;
    const loop = () => {
      draw();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    app.onLeave(() => cancelAnimationFrame(id));
  }

  // Save the minutes of a session (at least one) and tell the user
  function finish(el, { minutes, kind, title }) {
    if (minutes >= 1) AppData.addSession(minutes, kind);
    Notice.show(el, {
      title,
      text: minutes >= 1 ? `${minutes} min added to your focus today.` : "Session ended before the first minute.",
      icon: "assets/app/element-earth-small.svg",
      element: "earth",
      tone: "green",
    });
  }

  function durationChips(values, chosen) {
    return `
      <div class="chips chips--center" role="radiogroup" aria-label="Length">
        ${values.map((m) => `<button class="chip" type="button" data-minutes="${m}" aria-pressed="${m === chosen}">${m} min</button>`).join("")}
      </div>
    `;
  }

  // Quick lengths + tapping the time to set any length
  function wireLength(el, timer, timeEl, onChange) {
    const chips = el.querySelectorAll("[data-minutes]");
    const mark = (seconds) => chips.forEach((c) => c.setAttribute("aria-pressed", String(Number(c.dataset.minutes) * 60 === seconds)));
    const set = (seconds) => {
      const wasRunning = timer.running();
      timer.reset(seconds);
      if (wasRunning) timer.start();
      mark(seconds);
      if (onChange) onChange(seconds);
    };
    chips.forEach((chip) => chip.addEventListener("click", () => set(Number(chip.dataset.minutes) * 60)));
    timeEl.setAttribute("role", "button");
    timeEl.setAttribute("tabindex", "0");
    timeEl.setAttribute("aria-label", "Change the time");
    const open = () => Modal.time(el, { title: "Set time", seconds: timer.total(), onSet: set });
    timeEl.addEventListener("click", open);
    timeEl.addEventListener("keydown", (e) => e.key === "Enter" && open());
  }

  // ---------- Pomodoro / rest timer ----------

  window.Screens.timer = {
    render(app, params) {
      const rest = params.mode === "rest";
      const MODE = rest
        ? { title: "Stillness", minutes: [10, 20, 30], chosen: 30, quote: "Let the day settle,<br />let your water rest.", kind: "rest", task: "Rest &amp; recover<br /><span>Water · Rest &amp; Heal</span>" }
        : { title: "Pomodoro Timer", minutes: [15, 25, 50], chosen: 25, quote: "Building your momentum,<br />one breath at a time.", kind: "focus", task: "Finish design system documentation<br /><span>Focusing on Explore &amp; Create</span>" };
      const startSeconds = (params.minutes || MODE.chosen) * 60;
      const round = { done: 2, of: 4 };
      const R = 128;
      const C = 2 * Math.PI * R;

      const goal = () => Store.get().focusGoal;
      const goalHtml = () => {
        const g = goal();
        if (rest) return MODE.task;
        if (g === "") return '<span class="timer-task__empty">No goal — just focus ✎</span>';
        return `${UI.escape(g || "Finish design system documentation")} ✎<br /><span>Focusing on Explore &amp; Create</span>`;
      };

      const el = layout({
        id: "timer",
        title: MODE.title,
        action: "Start Timer",
        link: "",
        content: `
          <div class="timer-ring" data-enter>
            <img class="timer-ring__sun" src="assets/images/mandala-sun.png" alt="" />
            <svg class="timer-ring__svg" width="290" height="290" viewBox="0 0 290 290" fill="none">
              <defs>
                <linearGradient id="ring-${MODE.kind}" x1="0" y1="290" x2="290" y2="0" gradientUnits="userSpaceOnUse">
                  ${rest
                    ? '<stop stop-color="#0E4385"/><stop offset="0.6" stop-color="#35ABEB"/><stop offset="1" stop-color="#D9FAF5"/>'
                    : '<stop style="stop-color: var(--ring-start, #6C2206)"/><stop offset="0.55" style="stop-color: var(--ring-mid, #C97A1E)"/><stop offset="1" style="stop-color: var(--ring-end, #F3E21C)"/>'}
                </linearGradient>
              </defs>
              <circle cx="145" cy="145" r="${R + 14}" stroke="white" stroke-opacity="0.35" stroke-width="1.5"/>
              <circle cx="145" cy="145" r="${R}" stroke="white" stroke-opacity="0.08" stroke-width="10"/>
              <circle class="timer-ring__progress" cx="145" cy="145" r="${R}" stroke="url(#ring-${MODE.kind})" stroke-width="10"
                      stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 145 145)"/>
            </svg>
            <div class="timer-ring__text">
              <p class="timer-ring__time" data-time>${clock(startSeconds)}</p>
              <p class="timer-ring__hint">tap to change</p>
              <p class="timer-ring__quote">${MODE.quote}</p>
            </div>
          </div>
          <div data-enter>${durationChips(MODE.minutes, startSeconds / 60)}</div>
          <div class="timer-stats" data-enter>
            <div class="card"><b data-round>${round.done} / ${round.of}</b>${rest ? "Rest blocks" : "Pomodoro"}</div>
            <div class="card"><b>${AppData.streak(AppData.today())} days</b>Streak</div>
            <div class="card"><b data-percent>0%</b>Progress</div>
          </div>
          <button class="card timer-task" type="button" data-goal data-enter ${rest ? "disabled" : ""}>${goalHtml()}</button>
          <div class="sound-row" data-enter>
            <span class="sound-row__label">${ICONS.sound} Sound</span>
            <div class="chips">
              ${["off", "rain", "calm", "birds"].map((s) => `<button class="chip" type="button" data-sound="${s}" aria-pressed="${s === "off"}">${s === "calm" ? "Sea" : AppShell.capital(s)}</button>`).join("")}
            </div>
          </div>
        `,
      });

      const time = el.querySelector("[data-time]");
      const ring = el.querySelector(".timer-ring__progress");
      const percent = el.querySelector("[data-percent]");
      const main = el.querySelector("[data-main]");
      let sound = "off";
      let playing = null;
      // Birds is a real recording; the others are made by the sound engine
      const RECORDED = { birds: "assets/sounds/birds.m4a?v=1" };
      const playSound = () => (playing = sound === "off" ? null : Sound.ambient(RECORDED[sound] || sound, 0.4, sound));
      const stopSound = () => Sound.stopAmbient(playing);

      const timer = countdown(startSeconds, {
        onTick(left, total) {
          time.textContent = clock(left);
          percent.textContent = `${Math.round((1 - left / total) * 100)}%`;
        },
        onDone() {
          Sound.chime();
          stopSound();
          round.done = Math.min(round.of, round.done + 1);
          el.querySelector("[data-round]").textContent = `${round.done} / ${round.of}`;
          finish(el, { minutes: Math.round(timer.total() / 60), kind: MODE.kind, title: rest ? "Rest complete" : "Pomodoro complete" });
          setState();
        },
      });
      everyFrame(app, () => (ring.style.strokeDashoffset = String(C * timer.fraction())));

      function setState() {
        const running = timer.running();
        main.textContent = running ? "Pause Timer" : timer.elapsed() ? "Resume Timer" : "Start Timer";
        el.classList.toggle("is-running", running);
      }

      function startPause() {
        if (timer.running()) {
          timer.pause();
          stopSound();
        } else {
          timer.start();
          playSound();
        }
        setState();
      }

      main.addEventListener("click", startPause);

      // The goal: any text, or no goal at all
      el.querySelector("[data-goal]").addEventListener("click", () =>
        Modal.open(el, {
          title: "Your focus",
          body: `
            <label class="modal-field"><span>What will you focus on?</span>
              <input type="text" placeholder="e.g. Write the report" value="${UI.escape(goal() || "")}" />
            </label>
            <div class="modal__actions">
              <button class="text-action text-action--red" type="button" data-none>No goal</button>
              <button class="text-action text-action--purple" type="button" data-save>Save</button>
            </div>
          `,
          onMount(panel, close) {
            const input = panel.querySelector("input");
            input.focus();
            const set = (value) => {
              Store.set({ focusGoal: value });
              el.querySelector("[data-goal]").innerHTML = goalHtml();
              close();
            };
            panel.querySelector("[data-save]").addEventListener("click", () => set(input.value.trim()));
            panel.querySelector("[data-none]").addEventListener("click", () => set(""));
            input.addEventListener("keydown", (e) => e.key === "Enter" && set(input.value.trim()));
          },
        })
      );
      wireLength(el, timer, time, setState);
      el.querySelectorAll("[data-sound]").forEach((chip) =>
        chip.addEventListener("click", () => {
          sound = chip.dataset.sound;
          el.querySelectorAll("[data-sound]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
          stopSound();
          playSound();
          // While the timer is stopped, play a short preview
          if (!timer.running()) {
            const preview = playing;
            setTimeout(() => !timer.running() && Sound.stopAmbient(preview), 2500);
          }
        })
      );

      wireLayout(el, app);
      app.onLeave(() => {
        timer.stop();
        stopSound();
      });
      return el;
    },
  };

  // ---------- Silence Mode ----------

  window.Screens.blocker = {
    render(app) {
      const el = layout({
        id: "blocker",
        title: "Silence Mode",
        action: "Start Session",
        content: `
          <div class="silence-orb" data-enter>
            <div class="silence-orb__pie"></div>
            <img class="silence-orb__sun" src="assets/images/mandala-sun.png" alt="" />
          </div>
          <p class="silence-time" data-time data-enter>${clock(25 * 60)}</p>
          <p class="timer-ring__hint" data-enter>tap the time to change it</p>
          <div data-enter>${durationChips([15, 25, 45, 60], 25)}</div>
          <p class="silence-note" data-enter>Notifications, calls and social apps stay quiet until the circle closes.</p>
          <p class="silence-title" data-enter>Distractions Silenced.</p>
        `,
      });

      const time = el.querySelector("[data-time]");
      const pie = el.querySelector(".silence-orb__pie");
      const main = el.querySelector("[data-main]");
      const timer = countdown(25 * 60, {
        onTick(left) {
          time.textContent = clock(left);
        },
        onDone() {
          Sound.chime();
          finish(el, { minutes: Math.round(timer.total() / 60), kind: "silence", title: "Silence complete" });
          setState();
        },
      });
      // The circle closes continuously, not in one-second steps
      everyFrame(app, () => pie.style.setProperty("--done", `${timer.fraction() * 360}deg`));

      const setState = () => {
        main.textContent = timer.running() ? "Pause Session" : timer.elapsed() ? "Resume Session" : "Start Session";
        el.classList.toggle("is-running", timer.running());
      };
      main.addEventListener("click", () => {
        if (timer.running()) timer.pause();
        else timer.start();
        setState();
      });
      el.querySelector("[data-end]").addEventListener("click", () => {
        finish(el, { minutes: Math.floor(timer.elapsed() / 60), kind: "silence", title: "Session ended" });
        timer.reset();
        setState();
      });
      wireLength(el, timer, time, setState);
      wireLayout(el, app);
      app.onLeave(() => timer.stop());
      return el;
    },
  };

  // ---------- Breath Work ----------

  const PATTERNS = {
    box: { name: "Box", label: "4-4-4-4", element: "earth", steps: [["in", 4], ["hold", 4], ["out", 4], ["hold", 4]] },
    relax: { name: "Relax", label: "4-7-8", element: "water", steps: [["in", 4], ["hold", 7], ["out", 8]] },
    simple: { name: "Simple", label: "5-0-5", element: "air", steps: [["in", 5], ["out", 5]] },
  };
  const PHASE_TEXT = { in: "Breathe in…", hold: "Hold…", out: "Breathe out…" };
  const CYCLES = 8;

  window.Screens.breathing = {
    render(app) {
      let pattern = "relax";
      const el = layout({
        id: "breathing",
        title: "Breath Work",
        action: "Start Session",
        link: "",
        content: `
          <div class="breath-orb" data-enter>
            <div class="breath-orb__glow"></div>
            <div class="breath-orb__grain"></div>
            <img class="breath-orb__sun" src="assets/images/mandala-sun.png" alt="" />
          </div>
          <p class="breath-text" data-phase data-enter>Follow the glow.<br />Synchronize your spirit.</p>
          <div class="breath-cycles" data-enter>
            <p data-cycle>Cycle 0 of ${CYCLES}</p>
            <div class="breath-dots">${Array.from({ length: CYCLES }, () => "<span></span>").join("")}</div>
          </div>
          <div class="breath-patterns" role="radiogroup" aria-label="Pattern" data-enter>
            ${Object.entries(PATTERNS).map(([id, p]) => `
              <button class="breath-pattern el-${p.element}" type="button" data-pattern="${id}" aria-pressed="${id === pattern}">
                <span class="breath-pattern__card"><b>${p.name}</b>${p.label}</span>
                <span>${AppShell.capital(p.element)}</span>
              </button>
            `).join("")}
          </div>
        `,
      });

      const orb = el.querySelector(".breath-orb");
      const text = el.querySelector("[data-phase]");
      const cycleText = el.querySelector("[data-cycle]");
      const dots = el.querySelectorAll(".breath-dots span");
      const main = el.querySelector("[data-main]");
      let timer = null;
      let cycle = 0;
      let step = 0;
      let started = 0;

      function runStep() {
        const [phase, seconds] = PATTERNS[pattern].steps[step];
        orb.dataset.phase = phase;
        orb.style.setProperty("--breath-time", `${seconds}s`);
        text.textContent = PHASE_TEXT[phase];
        Sound.breath(phase, seconds);
        if ("vibrate" in navigator) navigator.vibrate(30);
        timer = setTimeout(next, seconds * 1000);
      }

      function next() {
        step += 1;
        if (step >= PATTERNS[pattern].steps.length) {
          step = 0;
          cycle += 1;
          update();
          if (cycle >= CYCLES) return stop(true);
        }
        runStep();
      }

      function update() {
        cycleText.textContent = `Cycle ${cycle} of ${CYCLES}`;
        dots.forEach((d, i) => d.classList.toggle("is-done", i < cycle));
      }

      function stop(completed) {
        clearTimeout(timer);
        timer = null;
        Sound.breathStop();
        orb.dataset.phase = "";
        const minutes = Math.round((Date.now() - started) / 60000);
        if (started) finish(el, { minutes, kind: "breath", title: completed ? "Breath work complete" : "Session ended" });
        started = 0;
        text.innerHTML = "Follow the glow.<br />Synchronize your spirit.";
        main.textContent = "Start Session";
        el.classList.remove("is-running");
        if (completed) Sound.chime();
      }

      main.addEventListener("click", () => {
        if (timer) return stop(false);
        cycle = 0;
        step = 0;
        started = Date.now();
        update();
        main.textContent = "End Session";
        el.classList.add("is-running");
        Sound.breathStart();
        runStep();
      });
      el.querySelectorAll("[data-pattern]").forEach((b) =>
        b.addEventListener("click", () => {
          pattern = b.dataset.pattern;
          el.querySelectorAll("[data-pattern]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        })
      );
      wireLayout(el, app);
      app.onLeave(() => {
        clearTimeout(timer);
        Sound.breathStop();
      });
      return el;
    },
  };

  // ---------- Nature Sounds ----------
  // Pictures: the design's ocean and rain photos and the element pictures.
  // A scene with `video` plays it (muted, looping) instead of the picture:
  // put the file in assets/focus/videos/ and add its path below.

  // Nature scenes. image: picture or animated GIF (assets/focus/scenes);
  // audio: real recording (assets/sounds); sound: synth used if there's no recording (defaults to the id)
  const G = (file) => `assets/focus/scenes/${file}?v=2`;
  const MEDIA_VERSION = 2; // bump when a sound or video file is replaced, so browsers fetch the new one
  const S = (name) => `assets/sounds/${name}.m4a?v=${MEDIA_VERSION}`; // credits: assets/sounds/CREDITS.md
  const SCENES = [
    { id: "kitty", audio: S("purr"), credit: "Universfield · Pixabay", name: "Sleepy Kitty", sound: "calm", image: G("kitty.jpg"), video: G("kitty.mp4"), element: "air", quote: "Soft paws, slow breaths, nowhere to be." },
    // Sea
    // Rain
    // Storm
    // Falls and streams
    { id: "forestfalls", audio: S("forest-falls"), credit: "NickyPe · Pixabay", name: "Forest Falls", sound: "birds", image: G("forest-falls.gif"), element: "earth", quote: "Green stone, white water, slow breath." },
    { id: "stream", audio: S("stream"), credit: "Universfield · Pixabay", name: "Mountain Stream", sound: "calm", image: G("mountain-stream.gif"), element: "water", quote: "Go around the stones, keep flowing." },
    // Land and sky
    { id: "snow", audio: S("winter"), credit: "SSPsurvival · Pixabay", name: "Snowfall", sound: "calm", image: G("snowfall.gif"), element: "metal", quote: "Everything softens under snow." },
  ];

  window.Screens.sounds = {
    render(app) {
      let chosen = 0;
      const el = layout({
        id: "sounds",
        title: "Nature Sounds",
        action: "Choose Scene",
        link: "",
        content: `
          <div class="scenes" data-enter>
            ${SCENES.map((s, i) => `
              <button class="scene" type="button" data-scene="${i}" aria-label="${s.name}">
                <img class="scene__video" src="${s.image}" alt="" loading="lazy" decoding="async" />
                ${s.video ? `<video class="scene__video" src="${s.video}" poster="${s.image}" autoplay muted loop playsinline></video>` : ""}
                <span class="scene__name">${s.name}</span>
              </button>
            `).join("")}
          </div>
          <div class="scene-tags" data-enter>
            ${SCENES.map((s, i) => `<button class="scene-tag el-${s.element}" type="button" data-tag="${i}" aria-pressed="${i === 0}">${s.name}</button>`).join("")}
          </div>
        `,
      });

      const strip = el.querySelector(".scenes");
      const cards = el.querySelectorAll(".scene");
      const tags = el.querySelectorAll(".scene-tag");
      let preview = null;

      const mark = (i) => {
        tags.forEach((t, k) => t.setAttribute("aria-pressed", String(k === i)));
        cards.forEach((c, k) => c.classList.toggle("is-chosen", k === i));
      };

      // The chosen scene's sound plays quietly while browsing
      const listen = (i) => {
        preview = Sound.ambient(SCENES[i].audio || SCENES[i].sound || SCENES[i].id, 0.35, SCENES[i].sound || SCENES[i].id);
      };

      function select(i) {
        chosen = i;
        mark(i);
        // Bring the card to the middle of the strip
        const card = cards[i].getBoundingClientRect();
        const box = strip.getBoundingClientRect();
        strip.scrollTo({ left: strip.scrollLeft + card.left + card.width / 2 - (box.left + box.width / 2), behavior: "smooth" });
        listen(i);
      }

      tags.forEach((t) => t.addEventListener("click", () => select(Number(t.dataset.tag))));
      cards.forEach((c) =>
        c.addEventListener("click", () => {
          if (Number(c.dataset.scene) === chosen) open();
          else select(Number(c.dataset.scene));
        })
      );
      // Swiping the gallery chooses the card that lands in the middle
      let settle = null;
      strip.addEventListener("scroll", () => {
        clearTimeout(settle);
        settle = setTimeout(() => {
          const step = cards[1].offsetLeft - cards[0].offsetLeft;
          const best = Math.min(cards.length - 1, Math.round(strip.scrollLeft / step));
          if (best !== chosen) {
            chosen = best;
            mark(best);
            listen(best);
          }
        }, 120);
      });

      const open = () => app.go("player", { transition: "fade", duration: 900, params: { scene: chosen } });
      el.querySelector("[data-main]").addEventListener("click", open);
      mark(0);
      // The first scene starts sounding as soon as the screen opens (we arrive here by a tap)
      listen(0);
      wireLayout(el, app);
      // Only stops the preview (never without one: that would silence the player's sound)
      app.onLeave(() => preview && Sound.stopAmbient(preview));
      return el;
    },
  };

  // ---------- Scene player ----------

  window.Screens.player = {
    render(app, params) {
      const scene = SCENES[params.scene || 0];
      const R = 92;
      const C = 2 * Math.PI * R;

      const el = layout({
        id: "player",
        title: scene.name,
        action: "End",
        link: "",
        background: scene.image,
        content: `
          <div class="player-ring" data-enter>
            <svg width="216" height="216" viewBox="0 0 216 216" fill="none">
              <circle cx="108" cy="108" r="${R}" stroke="white" stroke-opacity="0.35" stroke-width="1.2"/>
              <circle class="player-ring__progress" cx="108" cy="108" r="${R}" stroke="url(#player-grad)" stroke-width="10" stroke-linecap="round"
                      stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 108 108)"/>
              <defs><linearGradient id="player-grad" x1="0" y1="0" x2="216" y2="216" gradientUnits="userSpaceOnUse">
                <stop style="stop-color: var(--ring-start, #56C079)"/><stop offset="0.55" style="stop-color: var(--ring-mid, #9fbc5a)"/><stop offset="1" style="stop-color: var(--ring-end, #FFB93C)"/></linearGradient></defs>
            </svg>
            <p class="player-ring__time" data-time>${clock(30 * 60)}</p>
          </div>
          <p class="player-quote" data-enter>${scene.quote}</p>
          ${scene.credit ? `<p class="player-credit" data-enter>Sound: ${scene.credit}</p>` : ""}
          <div data-enter>${durationChips([15, 30, 60], 30)}</div>
          <div class="player-volume" data-enter>
            <button class="player-mute" type="button" aria-label="Mute" aria-pressed="false">${ICONS.sound}</button>
            <input type="range" min="0" max="100" value="60" aria-label="Volume" />
          </div>
        `,
      });

      if (scene.video) {
        el.insertAdjacentHTML("afterbegin", `<video class="player-video" src="${scene.video}" poster="${scene.image}" autoplay muted loop playsinline></video>`);
      }
      const time = el.querySelector("[data-time]");
      const ring = el.querySelector(".player-ring__progress");
      let volume = 0.6;
      let playing = null;

      const timer = countdown(30 * 60, {
        onTick(left) {
          time.textContent = clock(left);
        },
        onDone() {
          Sound.stopAmbient(playing);
          Sound.chime();
          finish(el, { minutes: Math.round(timer.total() / 60), kind: "sounds", title: `${scene.name} session complete` });
        },
      });
      everyFrame(app, () => (ring.style.strokeDashoffset = String(C * (1 - timer.fraction()))));

      // One tap on the speaker mutes the sound (the icon gets crossed out); another brings it back
      const muteButton = el.querySelector(".player-mute");
      let muted = false;
      const setMuted = (on) => {
        muted = on;
        muteButton.innerHTML = on ? ICONS.muted : ICONS.sound;
        muteButton.setAttribute("aria-pressed", String(on));
        muteButton.setAttribute("aria-label", on ? "Unmute" : "Mute");
        el.querySelector(".player-volume").classList.toggle("is-muted", on);
        Sound.setVolume(on ? 0 : volume);
      };
      muteButton.addEventListener("click", () => setMuted(!muted));
      el.querySelector('input[type="range"]').addEventListener("input", (e) => {
        volume = Number(e.target.value) / 100;
        // Moving the slider turns the sound back on
        if (muted) setMuted(false);
        else Sound.setVolume(volume);
      });
      wireLength(el, timer, time);
      el.querySelector("[data-main]").addEventListener("click", () => {
        const done = Math.floor(timer.elapsed() / 60);
        timer.stop();
        Sound.stopAmbient(playing);
        finish(el, { minutes: done, kind: "sounds", title: "Session ended" });
        setTimeout(() => app.go("sounds", { transition: "fade", duration: 800 }), 600);
      });

      wireLayout(el, app, { back: "sounds" });
      // Starts right away: the sound and the timer
      timer.start();
      playing = Sound.ambient(scene.audio || scene.sound || scene.id, volume, scene.sound || scene.id);
      app.onLeave(() => {
        timer.stop();
        Sound.stopAmbient(playing);
      });
      return el;
    },
  };
})();
