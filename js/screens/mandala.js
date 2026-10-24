// ONB_02 Mandala Philosophy — Figma node 2938:5062
// Shown after the splash. The design has no button here: a tap or a swipe left moves
// on to the name input (ONB_03), a swipe right goes back to the splash.

window.Screens = window.Screens || {};

// Where each element sign sits on the mandala (centre, in the 330×330 circle) — as in Figma
// on a regular pentagon centred in the circle, so they stand evenly around it
const MANDALA_SIGNS = [["metal", 165, 53], ["earth", 271.5, 130.4], ["fire", 230.8, 255.6], ["water", 99.2, 255.6], ["air", 58.5, 130.4]];

// The turning mandala inside the glass circle (330×330): faint grid, white sun, still signs.
// The splash builds the same thing inside its own circle when it grows into this one.
window.MandalaArt = () => `
  <div class="mandala__art">
    <img class="mandala__illustration" src="assets/images/mandala-grid.png" width="330" height="330" alt="" data-spin="90" />
    <img class="mandala__sun-spin" src="assets/images/sun.png" width="176" height="176" alt="" data-spin="90" />
    ${MANDALA_SIGNS.map(([id, x, y]) =>
      `<img class="mandala__sign" src="assets/icons/element-${id}.png" alt="" style="left: ${x}px; top: ${y}px" />`).join("")}
  </div>`;

window.Screens.mandala = {
  render(app, params) {
    const el = document.createElement("section");
    // Coming from the splash (same desert behind both), the screen is there at once:
    // only the circle grows out of the splash circle, and the rest fades in on top of it
    el.className = `screen mandala${params.fromSplash ? " mandala--from-splash" : ""}`;
    el.innerHTML = `
      <div class="mandala__chart">
        <div class="mandala__circle liquid-glass--turn" data-morph="hero-circle" data-spin="70">
          <!-- The sun and its grid turn slowly; the five element signs stay upright in place -->
          ${MandalaArt()}
        </div>
        <!-- Where the sun sits inside the mandala picture: the sun on the next
             screen (ONB_03) lands exactly here during the transition -->
        <div class="mandala__sun-anchor" data-morph="sun"></div>
        <p class="mandala__slogan" data-enter>Finding harmony in every moment.</p>
      </div>
    `;

    const next = () => app.go("name", { transition: "fade" });
    UI.onGesture(el, {
      next,
      tap: next,
      prev: () => app.go("splash", { transition: "fade", duration: 2000 }),
    });

    return el;
  },

  mounted(el, app) {
    app.onLeave(LiquidGlass.apply(el.querySelector(".mandala__circle"), el, LiquidGlass.presets.alpha25));
  },
};
