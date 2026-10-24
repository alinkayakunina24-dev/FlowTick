// APP Focus Mode — Figma node 2942:33173
// Four session types; each card opens its own screen (js/screens/focus/sessions.js).

window.Screens = window.Screens || {};

window.Screens.focus = {
  render(app) {
    const modes = [
      { label: "TIMER", title: "Pomodoro Timer", text: "Deep work sessions with smart break scheduling.", image: "fire", screen: "timer" },
      { label: "APP BLOCKER", title: "Silence Mode", text: "Block distracting apps during your focus session.", image: "metal", screen: "blocker" },
      { label: "BREATHING", title: "Breath Work", text: "Guided breathing exercises to calm your mind and restore elemental balance.", image: "water", screen: "breathing" },
      { label: "NATURE SOUNDS", title: "Nature Sounds", text: "Ambient nature sounds to support focus and deepen elemental awareness.", image: "earth", screen: "sounds" },
    ];

    // Light themes use the light element photos (as on the "Start" screen)
    const lightWater = (document.documentElement.dataset.theme || "").startsWith("light-");
    const PHOTO = { timer: "fire", blocker: "air", breathing: "water", sounds: "earth" };
    const cards = modes.map((m) => `
      <div class="focus-mode" data-enter>
        <p class="section-label section-label--dim">${m.label}</p>
        <button class="focus-mode__card${lightWater ? " focus-mode__card--photo" : ""}" type="button" data-screen="${m.screen}"
                style="background-image: ${lightWater
                  ? `url('assets/images/ready-light-${PHOTO[m.screen]}.jpg')`
                  : `linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 16.913%, rgba(0, 0, 0, 0) 78.194%), url('assets/images/element-${m.image}-bg.png')`}">
          <span class="focus-mode__title">${m.title}</span>
          ${AppShell.divider()}
          <span class="focus-mode__text">${m.text}</span>
        </button>
      </div>
    `).join("");

    const content = `
      ${AppShell.header({ title: "Focus Mode", subtitle: "Choose your session type" })}
      <div class="focus-modes">${cards}</div>
    `;

    const el = AppShell.screen({ tab: "focus", content });
    el.querySelector(".app__content").classList.add("app__content--roomy");
    AppShell.wire(el, app);
    el.querySelectorAll("[data-screen]").forEach((card) =>
      card.addEventListener("click", () =>
        app.go(card.dataset.screen, { transition: "fade", duration: 900, params: { mode: "focus" } })
      )
    );
    return el;
  },
};
