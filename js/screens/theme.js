// ONB_10 Element Selection (theme choice) — Figma node 2938:5198
// Two orbs: dark (top) and light (bottom). Tapping one selects it and scales it up.
// "Continue" opens the next screen as a circle growing out of the chosen orb.

window.Screens = window.Screens || {};

window.Screens.theme = {
  render(app) {
    const el = document.createElement("section");
    el.className = "screen bg-desert-gradient";
    el.innerHTML = `
      <div class="mandala-deco" data-spin="240" data-transition="static"></div>
      <div class="onb-frame theme__frame">
        <div class="theme__display" role="radiogroup" aria-label="Theme">
          <div class="theme__pill theme__pill--dark" data-enter>
            <button class="theme-orb theme-orb--dark" type="button" role="radio" data-theme="dark" aria-label="Dark theme">
              <img class="theme-orb__glow" src="assets/icons/orb-glow-dark.svg" width="196" height="196" alt="" />
              <img class="theme-orb__mandala" src="assets/images/mandala-grid.png" width="182" height="182" alt="" data-spin="90" />
            </button>
          </div>
          <div class="theme__pill theme__pill--light" data-enter>
            <button class="theme-orb theme-orb--light" type="button" role="radio" data-theme="light" aria-label="Light theme">
              <img class="theme-orb__glow" src="assets/icons/orb-glow-light.svg" width="196" height="196" alt="" />
              <img class="theme-orb__mandala" src="assets/images/mandala-grid.png" width="182" height="182" alt="" data-spin="90" />
            </button>
          </div>
        </div>
        <div class="cta">
          <h1 class="cta__title" data-enter>How do you like it?</h1>
          <p class="cta__text" data-enter>Tap a side to choose your theme.</p>
          ${UI.ctaButtons()}
        </div>
      </div>
    `;

    const orbs = el.querySelectorAll(".theme-orb");
    let chosen = null;
    const select = (theme) => {
      chosen = theme;
      orbs.forEach((orb) => orb.setAttribute("aria-checked", String(orb.dataset.theme === theme)));
    };
    orbs.forEach((orb) => orb.addEventListener("click", () => select(orb.dataset.theme)));

    // The next screen opens as a circle from the chosen orb (or from the tapped button)
    const reveal = (from) => app.go("intentions", { transition: "reveal", origin: app.pointOf(from) });

    // Keep the chosen theme and open the next screen from its orb
    // (or from the Continue button when nothing is chosen)
    const next = () => {
      if (chosen) Store.set({ theme: chosen });
      reveal(chosen ? el.querySelector(`[data-theme="${chosen}"]`) : el.querySelector('[data-action="next"]'));
    };

    UI.onCta(el, { next, skip: (e) => reveal(e.currentTarget) });
    UI.onGesture(el, { next, prev: () => app.go("element-fire", { transition: "fade" }) });

    return el;
  },
};
