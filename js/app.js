// A tiny router: shows one screen at a time and animates the switch between screens.
// Each screen lives in js/screens/ and registers itself in window.Screens.
//
// app.go(name, options) — options:
//   transition  "fade"   soft cross-fade; text and buttons marked data-enter appear one by one,
//                        elements with the same data-morph="key" on both screens glide
//                        from their old place and size to the new one
//               "slide"  the new screen slides in from the right, with parallax;
//                        direction: "back" slides the other way
//               "reveal" the new screen opens as a growing circle from `origin` {x, y}
//               "dip"    the old screen fades to darkness, then the new one fades in
//   duration    ms, to make one transition slower or faster
//
// Elements marked data-transition="static" (background decorations) never animate.
// Handy while developing: open index.html?screen=<name> to jump straight to a screen
// (e.g. ?screen=splash for the onboarding).

(function () {
  const DURATIONS = { fade: 1400, slide: 1200, reveal: 1100, dip: 1600 };
  const EASE_SOFT = "cubic-bezier(0.37, 0, 0.63, 1)";

  const root = document.getElementById("app");
  let current = null;
  let timers = [];
  let leaving = [];
  let busy = false;
  let finishPending = null; // ends the transition that is still playing

  // How much the computer preview frame is scaled (1 on a phone)
  function deviceScale() {
    return root.getBoundingClientRect().width / root.offsetWidth || 1;
  }

  // Glide each data-morph element from its place on the old screen to its place on
  // the new one, while the old copy fades out on the way. Glass elements keep the
  // background inside them still while they move.
  function morph(oldLayer, next, ms) {
    const scale = deviceScale();
    const STEPS = 12;
    next.querySelectorAll("[data-morph]").forEach((to) => {
      const from = oldLayer.querySelector(`[data-morph="${to.dataset.morph}"]`);
      if (!from) return;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const dx = (a.left + a.width / 2 - (b.left + b.width / 2)) / scale;
      const dy = (a.top + a.height / 2 - (b.top + b.height / 2)) / scale;
      const s = a.width / b.width;
      const timing = { duration: ms, easing: EASE_SOFT };

      // Steps of each movement, so glass can follow them exactly
      const steps = (fn) => Array.from({ length: STEPS + 1 }, (_, i) => fn(i / STEPS));
      const toFrames = steps((p) => ({ dx: dx * (1 - p), dy: dy * (1 - p), s: s + (1 - s) * p }));
      const fromFrames = steps((p) => ({ dx: -dx * p, dy: -dy * p, s: 1 + (1 / s - 1) * p }));
      const css = (f) => ({ translate: `${f.dx}px ${f.dy}px`, scale: f.s });

      to.animate(toFrames.map(css), { ...timing, fill: "backwards" });
      LiquidGlass.track(to, toFrames, { ...timing, fill: "backwards" });

      from.animate(
        fromFrames.map((f, i) => ({ ...css(f), opacity: 1 - i / STEPS })),
        { ...timing, fill: "forwards" }
      );
      LiquidGlass.track(from, fromFrames, { ...timing, fill: "forwards" });
    });
  }

  const app = {
    // Run a callback after a delay; cancelled automatically when the screen changes.
    later(ms, fn) {
      timers.push(setTimeout(fn, ms));
    },

    // Run a callback when the current screen is removed (e.g. to free effects).
    onLeave(fn) {
      leaving.push(fn);
    },

    // Remove the entrance animations from a screen, so content that is redrawn
    // later (after the user changes something) doesn't play them again
    settle(el) {
      el.classList.remove(...[...el.classList].filter((c) => c.startsWith("screen--enter")));
    },

    // params: anything the screen needs, e.g. { mode: "rest" } for the timer
    // light: an opacity-only cross-fade (no blur, no scaling) — used between the tabs
    go(name, { transition, duration, direction, origin, params, light } = {}) {
      const screen = window.Screens[name];
      if (!screen) {
        console.info(`Screen "${name}" is not built yet`);
        return;
      }
      // A tap during a transition finishes it at once, so the app never feels stuck
      if (busy && finishPending) finishPending();

      // Remember where we are, so a page reload opens the same screen
      try {
        sessionStorage.setItem("shine.screen", JSON.stringify({ name, params: params || {} }));
      } catch (e) {}

      timers.forEach(clearTimeout);
      timers = [];
      const cleanups = leaving;
      leaving = [];

      // Onboarding screens always keep white text and a white status bar, whatever theme
      // is being tried out on them; the theme's dark ink starts with the app itself
      const onboarding = /^(splash|mandala|name|welcome|element-|theme$|intentions|ready)/.test(name);
      document.documentElement.toggleAttribute("data-onboarding", onboarding);
      const next = screen.render(app, params || {});
      // Anything that spins ([data-spin] = seconds per turn) continues from where the
      // previous screen left it: all of them follow one shared clock
      const now = performance.now() / 1000;
      [next, ...next.querySelectorAll("[data-spin]")].forEach((e) => {
        if (e.dataset.spin) e.style.setProperty("--spin-delay", `-${(now % Number(e.dataset.spin)).toFixed(2)}s`);
      });
      const previous = current;
      const animate =
        previous && DURATIONS[transition] && !matchMedia("(prefers-reduced-motion: reduce)").matches;

      let ghost = null;
      let chrome = null;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        busy = false;
        finishPending = null;
        if (previous) previous.remove();
        if (ghost) ghost.remove();
        // The tab bar & co. go back into their screen
        if (chrome) {
          next.append(...chrome.children);
          chrome.remove();
        }
        cleanups.forEach((fn) => fn());
      };

      current = next;

      if (!animate) {
        if (screen.enter) next.classList.add(screen.enter);
        finish();
        root.appendChild(next);
        if (screen.mounted) screen.mounted(next, app);
        return;
      }

      busy = true;
      finishPending = finish;
      const ms = duration || DURATIONS[transition];
      next.style.setProperty("--t-duration", `${ms}ms`);
      next.querySelectorAll("[data-enter]").forEach((el, i) => el.style.setProperty("--enter-index", i));

      // The layer whose animation ends the transition
      let endsWith = next;

      if (transition === "fade") {
        // Lift the old content into its own layer above the new screen, so it can
        // dissolve on top while the new screen fades in underneath it.
        // Static decorations stay on the old screen underneath, untouched.
        ghost = document.createElement("div");
        // Keep the old screen's classes, so its content keeps its look while it fades
        const keep = [...previous.classList].filter((c) => !c.startsWith("screen--"));
        ghost.className = `${keep.join(" ")} screen--leave-fade${light ? " screen--light" : ""}`;
        ghost.style.setProperty("--t-duration", `${ms}ms`);
        // Moving an element resets its scroll position, so remember and restore it
        const scrolled = [...previous.querySelectorAll("[data-scroll]")].map((s) => [s, s.scrollTop]);
        ghost.append(...[...previous.children].filter((child) => child.dataset.transition !== "static"));
        // Moving elements restarts their animations: keep the spinning ones in step
        const t = performance.now() / 1000;
        ghost.querySelectorAll("[data-spin]").forEach((e) =>
          e.style.setProperty("--spin-delay", `-${(t % Number(e.dataset.spin)).toFixed(2)}s`)
        );
        next.classList.add("screen--enter-fade");
        if (light) next.classList.add("screen--light");
        // The bottom chrome (tab bar and the shade under it) stays perfectly still on top
        // of both pages, so neither page ever slides over it during the fade
        const fixed = [...next.children].filter(
          (child) => child.dataset.transition === "static" && !child.classList.contains("mandala-deco")
        );
        if (fixed.length) {
          chrome = document.createElement("div");
          chrome.className = `${[...next.classList].filter((c) => !c.startsWith("screen--")).join(" ")} screen--chrome`;
          chrome.append(...fixed);
        }
        root.append(next, ghost);
        if (chrome) root.append(chrome);
        scrolled.forEach(([s, top]) => (s.scrollTop = top));
        endsWith = ghost;
      } else if (transition === "slide") {
        const back = direction === "back";
        previous.style.setProperty("--t-duration", `${ms}ms`);
        previous.classList.add(back ? "screen--leave-slide-back" : "screen--leave-slide");
        next.classList.add(back ? "screen--enter-slide-back" : "screen--enter-slide");
        // Going back, the old screen slides away on top and uncovers the new one
        if (back) root.insertBefore(next, previous);
        else root.appendChild(next);
        endsWith = back ? previous : next;
      } else if (transition === "dip") {
        previous.style.setProperty("--t-duration", `${ms}ms`);
        previous.classList.add("screen--leave-dip");
        next.classList.add("screen--enter-dip");
        root.appendChild(next);
      } else if (transition === "reveal") {
        const w = root.offsetWidth;
        const h = root.offsetHeight;
        const x = origin ? origin.x : w / 2;
        const y = origin ? origin.y : h / 2;
        const radius = Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y));
        next.style.setProperty("--reveal-x", `${x}px`);
        next.style.setProperty("--reveal-y", `${y}px`);
        next.style.setProperty("--reveal-r", `${radius}px`);
        next.classList.add("screen--enter-reveal");
        root.appendChild(next);
      }

      endsWith.addEventListener("animationend", (e) => e.target === endsWith && finish());
      // Fallback in case the animation never reports its end (e.g. a background tab)
      setTimeout(finish, ms + 1000);

      // Effects measure sizes, so they start before anything is moved by morph
      if (screen.mounted) screen.mounted(next, app);
      if (ghost) morph(ghost, next, ms);
    },

    // Position of an element inside the app, in screen pixels (for "reveal" origins)
    pointOf(el) {
      const scale = deviceScale();
      const a = el.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      return { x: (a.left + a.width / 2 - r.left) / scale, y: (a.top + a.height / 2 - r.top) / scale };
    },
  };

  window.App = app;

  // Shrink the computer preview frame when the window is shorter than the phone.
  function fitDevice() {
    const margin = 32;
    const scale = Math.min(1, (window.innerHeight - margin) / 874);
    document.documentElement.style.setProperty("--device-scale", scale);
  }
  fitDevice();
  window.addEventListener("resize", fitDevice);

  // The app opens on the splash (start of the onboarding), or on the screen open before a reload
  // ?theme=dark-water (etc.) switches the theme straight away — handy for checking each one
  const asked = (new URLSearchParams(location.search).get("theme") || "").match(/^(dark|light)-(water|air|metal|earth|fire)$/);
  if (asked) Store.set({ theme: asked[1], element: asked[2] });
  Theme.apply();

  // ?screen=<name> wins; otherwise a reload returns to the last screen of this tab
  const requested = new URLSearchParams(location.search).get("screen");
  let last = null;
  try {
    last = JSON.parse(sessionStorage.getItem("shine.screen"));
  } catch (e) {}
  if (requested && window.Screens[requested]) app.go(requested);
  else if (last && window.Screens[last.name]) app.go(last.name, { params: last.params });
  else app.go("splash");
})();
