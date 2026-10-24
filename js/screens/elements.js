// ONB_05–09 Element screens — Figma nodes 2938:5079 (Water), 2938:5130 (Air),
// 2938:5232 (Metal), 2938:5215 (Earth), 2938:5249 (Fire).
// All five share one layout; only the picture and the text change.
// Swipe left / right (or "Continue") to move between them.

window.Screens = window.Screens || {};

window.Elements = [
  {
    id: "water",
    name: "Water",
    title: "The Depth of Peace",
    text: "Surrender to the healing depths of the evening. Water invites you to dissolve the tensions of the day and submerge yourself in silent reflection. In this fluid state of being, you restore your vital resources, harmonize with your intuition, and prepare your soul for the profound renewal of quality sleep.",
    intention: "Rest & Heal",
  },
  {
    id: "air",
    name: "Air",
    title: "Breath of Inspiration",
    text: "Let the wind carry your thoughts beyond the horizon. Air awakens your curiosity and fuels the creative fire within. In this expansive element, you explore new ideas, absorb wisdom, and let your mind soar freely through the vast skies of possibility and learning.",
    intention: "Explore & Learn",
  },
  {
    id: "metal",
    name: "Metal",
    title: "Edge of Clarity",
    text: "Sharpen your mind to its finest edge. Metal calls you to precision, focus, and the art of discernment. Like a blade refined through fire, your attention becomes a powerful tool — cutting through distraction and illuminating the path to your highest potential with crystalline clarity.",
    intention: "Deep Focus",
  },
  {
    id: "earth",
    name: "Earth",
    title: "Roots of Stability",
    text: "Ground yourself in the quiet wisdom of the Earth. This element anchors you to your deepest values, nurturing patience and consistency in all you do. Through steady rhythms and grounded practice, you build the resilient foundation upon which your flourishing life is grown.",
    intention: "Build Routine",
  },
  {
    id: "fire",
    name: "Fire",
    title: "Flame of Action",
    text: "Ignite the force that moves mountains.<br />Fire is the element of passion, drive, and transformation. It fuels your ambitions and burns away all that no longer serves you. In the heat of focused action, you discover your power to create, inspire, and leave your luminous mark upon the world.",
    intention: "Act & Execute",
  },
];

window.Elements.forEach((element, index) => {
  const last = index === window.Elements.length - 1;

  // Element screens don't slide: the old page dissolves, the new background shows on
  // its own first, then the sign, the text and the button appear one by one, in 3D
  const STEP = { transition: "fade", duration: 3200, light: true };
  const goNext = (app) =>
    last
      ? app.go("theme", { transition: "fade" })
      : app.go(`element-${window.Elements[index + 1].id}`, STEP);
  const goPrev = (app) =>
    index === 0
      ? app.go("welcome", { transition: "fade" })
      : app.go(`element-${window.Elements[index - 1].id}`, STEP);

  window.Screens[`element-${element.id}`] = {
    render(app) {
      const el = document.createElement("section");
      el.className = "screen element";
      el.style.backgroundImage = `url("assets/images/element-${element.id}-bg.png")`;
      el.innerHTML = `
        <div class="onb-frame element__frame">
          <div class="element__orb liquid-glass--turn" data-enter data-spin="70">
            <img class="element__icon" src="assets/icons/element-${element.id}.png" width="64" height="71" alt="" />
            <h1 class="element__name">${element.name}</h1>
          </div>
          <div class="element-card">
            <div class="element-card__bg" data-enter></div>
            <div class="element-card__content">
              <div class="element-card__text">
                <h2 class="element-card__title" data-enter>${element.title}</h2>
                <p class="element-card__body" data-enter>${element.text}</p>
              </div>
              ${UI.ctaButtons()}
            </div>
          </div>
        </div>
      `;

      UI.onCta(el, {
        next: () => goNext(app),
        skip: () => app.go("theme", { transition: "fade" }),
      });
      UI.onGesture(el, { next: () => goNext(app), prev: () => goPrev(app) });

      return el;
    },

    mounted(el, app) {
      app.onLeave(LiquidGlass.apply(el.querySelector(".element__orb"), el, LiquidGlass.presets.alpha25));
    },
  };
});
