// ONB_04 Welcome — Figma node 3388:10042
// Greets the user by the name entered on ONB_03.

window.Screens = window.Screens || {};

window.Screens.welcome = {
  render(app) {
    const name = Store.get().name;
    const greeting = name ? `Welcome, ${UI.escape(name)}` : "Welcome";

    const el = document.createElement("section");
    el.className = "screen bg-desert-gradient";
    el.innerHTML = `
      <div class="mandala-deco" data-spin="240" data-transition="static"></div>
      <div class="welcome__hero">
        <img class="welcome__sun" data-morph="sun" data-spin="90" src="assets/images/sun.png" width="198" height="198" alt="" />
        <h1 class="welcome__title" data-enter>${greeting}</h1>
      </div>
      <div class="onb-frame">
        <div class="cta">
          <p class="cta__title" data-enter>Five fundamental elements shape the world of Shine.</p>
          ${UI.ctaButtons({ link: false })}
        </div>
      </div>
    `;

    const next = () => app.go("element-water", { transition: "fade", duration: 2400, light: true });
    UI.onCta(el, { next });
    UI.onGesture(el, { next, prev: () => app.go("name", { transition: "fade" }) });

    return el;
  },
};
