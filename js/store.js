// What the user chose: onboarding (name, theme, element), profile and settings.
// Kept in the browser's localStorage so it survives a page reload.

window.Store = (function () {
  const KEY = "shine.onboarding";
  const defaults = {
    name: "",
    theme: "dark",
    element: null,
    // Profile
    avatar: null, // a photo the user picked, as a data URL
    username: "@shine_soul",
    email: "hello@shine.app",
    birthday: "1995-03-21",
    location: "Copenhagen, DK",
    bio: "I build habits that align with my energy. Learning Danish, exploring philosophy, and training consistency.",
    // Settings
    notifications: { allow: true, daily: false },
    language: "en",
    font: { primary: "Caudex", secondary: "Allison", size: 1, stroke: 0 },
    reminders: null, // Smart Reminders list (null = the sample list)
  };

  function read() {
    try {
      return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY)));
    } catch {
      return Object.assign({}, defaults);
    }
  }

  let state = read();

  // Fonts and text size from Settings → Font apply to the whole app
  // `font` lets Settings → Font try a font before it's saved
  function applyFont(font = state.font) {
    const { primary, secondary, size, stroke } = font;
    const root = document.documentElement.style;
    root.setProperty("--font-text", `"${primary}", Georgia, serif`);
    root.setProperty("--font-display", `"${secondary}", cursive`);
    root.setProperty("--text-scale", size);
    root.setProperty("--text-stroke", `${stroke * 0.8}px`);
  }
  applyFont();

  return {
    applyFont,
    get() {
      return state;
    },
    set(patch) {
      state = Object.assign({}, state, patch);
      if (patch.font) applyFont();
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        // Private mode or storage blocked: keep the choice for this visit only
      }
    },
  };
})();
