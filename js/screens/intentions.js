// ONB_11 Set Intentions — Figma nodes 2938:5181 (default) and 3042:12423 (active)
// Five element cards, half-transparent until hovered. One can be chosen: it grows a
// little and lights up, like the chosen theme orb on ONB_10.

window.Screens = window.Screens || {};

window.Screens.intentions = {
  render(app) {
    // Water is chosen from the start; tapping another card switches to it
    let chosen = Store.get().element || "water";

    const cards = Elements.map((element) => {
      return `
        <div class="intention" data-enter>
          <p class="intention__label">${element.intention}</p>
          <button class="intention__row intention__row--${element.id}" type="button" role="radio"
                  data-element="${element.id}" aria-checked="${chosen === element.id}"
                  aria-label="${element.name}: ${element.intention}">
            <span class="intention__icon-card">
              <img src="assets/icons/element-${element.id}.png" width="42" height="48" alt="" />
            </span>
            <span class="intention__label-card">
              <span class="intention__name">${element.name}</span>
            </span>
          </button>
        </div>
      `;
    }).join("");

    const el = document.createElement("section");
    el.className = `screen intentions intentions--${Store.get().theme === "light" ? "light" : "dark"}`;
    el.innerHTML = `
      <div class="intentions__bgs" aria-hidden="true"></div>
      <div class="mandala-deco" data-spin="240" data-transition="static"></div>
      <div class="onb-frame intentions__frame">
        <h1 class="cta__title" data-enter>Set Your Intentions</h1>
        <div class="intentions__list" role="radiogroup" aria-label="Your element">${cards}</div>
        <div class="cta">
          <p class="cta__text" data-enter>Which elements will guide your day?</p>
          ${UI.ctaButtons()}
        </div>
      </div>
    `;

    // The background is the chosen theme's picture. A new choice fades in slowly ON TOP of
    // the old one, which stays fully visible underneath — so nothing else ever shows through.
    const mode = Store.get().theme === "light" ? "light" : "dark";
    const stack = el.querySelector(".intentions__bgs");
    const picture = (element) => `url("assets/themes/${mode}-${element}.jpg")`;
    // Load all five pictures now, so a fade never waits for a download
    Elements.forEach((e) => (new Image().src = `assets/themes/${mode}-${e.id}.jpg`));
    const showTheme = (element, instant) => {
      const layer = document.createElement("div");
      layer.className = "intentions__bg";
      layer.style.backgroundImage = picture(element);
      stack.appendChild(layer);
      const older = [...stack.children].slice(0, -1);
      if (instant) {
        layer.classList.add("is-on");
        older.forEach((o) => o.remove());
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add("is-on")));
        // Once the new picture fully covers them, the old layers go away
        layer.addEventListener("transitionend", () => older.forEach((o) => o.remove()), { once: true });
      }
      Theme.preview(mode, element);
    };
    showTheme(chosen, true);

    const rows = el.querySelectorAll(".intention__row");
    rows.forEach((row) => {
      row.addEventListener("click", () => {
        chosen = row.dataset.element;
        rows.forEach((r) => r.setAttribute("aria-checked", String(r.dataset.element === chosen)));
        showTheme(chosen);
      });
    });

    // Keep the choice: the rest of the app opens in that theme
    let saved = false;
    const next = () => {
      if (chosen) {
        Store.set({ element: chosen });
        saved = true;
      }
      Theme.apply();
      app.go("ready", { transition: "fade" });
    };
    // Going back without choosing returns to the saved theme
    app.onLeave(() => !saved && Theme.apply());

    UI.onCta(el, { next, skip: () => app.go("ready", { transition: "fade" }) });
    UI.onGesture(el, { next, prev: () => app.go("theme", { transition: "fade" }) });

    return el;
  },
};
