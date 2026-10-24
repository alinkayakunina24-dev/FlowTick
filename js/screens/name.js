// ONB_03 Name Input — Figma node 2938:5096
// "Continue" stays disabled until the name has at least 2 characters (designer's note).

window.Screens = window.Screens || {};

window.Screens.name = {
  render(app) {
    const el = document.createElement("section");
    el.className = "screen bg-desert-gradient";
    el.innerHTML = `
      <div class="mandala-deco" data-spin="240" data-transition="static"></div>
      <div class="onb-frame">
        <div class="name__form">
          <img class="name__sun" data-morph="sun" data-spin="90" src="assets/images/sun.png" width="182" height="182" alt="" />
          <div class="name__block" data-enter>
            <input class="text-field" type="text" placeholder="Your name..." autocomplete="given-name"
                   maxlength="30" aria-label="Your name" />
            <p class="name__hint">This helps us personalise your Shine experience.</p>
          </div>
        </div>
        <div class="cta">
          <h1 class="cta__title" data-enter>What should we call you?</h1>
          ${UI.ctaButtons({ disabled: true, link: false })}
        </div>
      </div>
    `;

    const input = el.querySelector(".text-field");
    const next = el.querySelector('[data-action="next"]');

    const isValid = () => input.value.trim().length >= 2;
    const update = () => (next.disabled = !isValid());
    const submit = () => {
      if (!isValid()) return;
      Store.set({ name: input.value.trim() });
      app.go("welcome", { transition: "fade" });
    };

    update();
    input.addEventListener("input", update);
    input.addEventListener("keydown", (e) => e.key === "Enter" && submit());
    UI.onCta(el, { next: submit });
    UI.onGesture(el, { next: submit, prev: () => app.go("mandala", { transition: "fade" }) });

    return el;
  },
};
