// ONB_12 Ready To Begin — Figma node 2938:5164
// Last onboarding screen. "Start" fades through darkness into Home.

window.Screens = window.Screens || {};

window.Screens.ready = {
  render(app) {
    const el = document.createElement("section");
    // The theme chosen during the onboarding is already the background here
    const s = Store.get();
    // One photo per element and theme; Air uses the same photo in both themes
    el.className = "screen";
    el.style.background = `#000 url("assets/themes/${s.theme === "light" ? "light" : "dark"}-${s.element || "water"}.jpg") center / cover no-repeat`;
    Theme.apply();
    el.innerHTML = `
      <div class="mandala-deco" data-spin="240" data-transition="static"></div>
      <div class="onb-frame ready__frame">
        <div class="ready__photo" data-enter style="background-image: url('assets/images/ready-${(s.element || "water") === "air" ? "dark" : s.theme === "light" ? "light" : "dark"}-${s.element || "water"}.jpg')"></div>
        <div class="cta">
          <h1 class="cta__title ready__title" data-enter>Your journey begins with a single breath. The rest will follow.</h1>
          ${UI.ctaButtons({ primary: "Start →", link: false })}
        </div>
      </div>
    `;

    const next = () => app.go("home", { transition: "dip" });
    UI.onCta(el, { next });
    UI.onGesture(el, { next, prev: () => app.go("intentions", { transition: "fade" }) });

    return el;
  },
};
