// ONB_01 Splash Screen — Figma node 2937:5160
// Fades in on launch. A tap or a swipe left moves on to the mandala; its glass
// circle glides out of this one.

window.Screens = window.Screens || {};

window.Screens.splash = {
  enter: "screen--fade-in",

  render(app) {
    // Every full restart of the onboarding starts with an empty name
    Store.set({ name: "" });

    const el = document.createElement("section");
    el.className = "screen splash";
    el.setAttribute("aria-label", "Shine");
    el.innerHTML = `
      <div class="splash__logo liquid-glass--turn" data-morph="hero-circle" data-spin="70">
        <div class="splash__content">
          <h1 class="splash__title">Shine</h1>
          <p class="splash__tagline">Habits  •  Tasks  •  Focus</p>
        </div>
      </div>
    `;

    // The circle itself becomes the mandala. Nothing is swapped: this very circle keeps
    // turning, grows and rises into the mandala's place, "Shine" melts away, the sun, signs
    // and slogan come in — and from then on this screen simply *is* the mandala screen.
    let stage = "splash"; // "splash" → "growing" → "mandala"
    const grow = () => {
      stage = "growing";
      const logo = el.querySelector(".splash__logo");
      // Start from wherever the breathing is right now, so nothing jumps
      const s0 = parseFloat(getComputedStyle(logo).scale) || 1;
      logo.classList.add("is-growing");
      // Mandala circle: 330px, its centre 56px higher than the splash circle's
      const S = 330 / 260;
      const growth = logo.animate(
        [{ translate: "0px 0px", scale: s0 }, { translate: "0px -56px", scale: S }],
        { duration: 2200, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards" }
      );
      growth.finished.then(() => {
        logo.style.translate = "0px -56px";
        logo.style.scale = String(S);
        growth.cancel();
      });

      // The mandala inside the circle (at the circle's own size), in step with the other suns
      const art = document.createElement("div");
      art.className = "splash__art";
      art.innerHTML = `${MandalaArt()}<div class="mandala__sun-anchor" data-morph="sun"></div>`;
      const t = performance.now() / 1000;
      art.querySelectorAll("[data-spin]").forEach((e) => e.style.setProperty("--spin-delay", `-${(t % 90).toFixed(2)}s`));
      logo.appendChild(art);
      // …and the slogan below it
      const chart = document.createElement("div");
      chart.className = "mandala__chart splash__slogan";
      chart.innerHTML = '<p class="mandala__slogan">Finding harmony in every moment.</p>';
      el.appendChild(chart);

      setTimeout(() => {
        stage = "mandala";
        // Settle into the final look for good: the entrance animations must not play again
        // when the circle is carried into the fading layer on the way to the next screen
        el.classList.add("is-mandala");
        el.setAttribute("aria-label", "Finding harmony in every moment");
        // A reload comes back to the real mandala screen
        try {
          sessionStorage.setItem("shine.screen", JSON.stringify({ name: "mandala", params: {} }));
        } catch (e) {}
      }, 2200);
    };
    const next = () => {
      if (stage === "splash") grow();
      else if (stage === "mandala") {
        el.querySelector(".splash__logo").removeAttribute("data-morph");
        app.go("name", { transition: "fade" });
      }
    };
    const prev = () => stage === "mandala" && app.go("splash", { transition: "fade", duration: 2000 });
    UI.onGesture(el, { next, tap: next, prev });

    return el;
  },

  // Called once the screen is on the page, so sizes can be measured
  mounted(el, app) {
    app.onLeave(LiquidGlass.apply(el.querySelector(".splash__logo"), el, LiquidGlass.presets.alpha25));
  },
};
