// App themes — every colour taken from the Figma "Theme Variants" examples
// (node 2842:2946: Theme_Screen_<Dark|Light>_<Element>, Analytics + Focus Timer).
//   accent    active period tab, active tab icon (and the tab bar, unless tabBar/tabLine are set)
//   card      period bar, cards, icon squares (Timer_Dot_Session, Period_Tab_Bar)
//   line      card border
//   advisory  Balance_Advisory_Card gradient (+ advisoryLine border)
//   badge     stops and border of the water "Start Stillness Now" badge
//   button    Primary_Action_Button (+ buttonLine border, buttonInk text)
//   fade      Tab_Bar_Background_Rect behind the tab bar
//   plate     Mandala_Chart_Axis_Vector_1 (pentagon under the radar)
//   ring      the two bright stops of the timer ring
//   ink       "dark" where Figma uses black text (Light Air, Light Metal), with sub = muted text
// Theme.apply() reads the choice from Store; Theme.preview() tries one out.

window.Theme = (function () {
  const ONYX = "rgba(5, 6, 17, 0.3)";
  const GOLD = ["rgba(179, 131, 35, 1)", "rgba(244, 230, 35, 1)"];
  const adv = (from, a, to, b) => `linear-gradient(109.7444deg, ${from} ${a}, ${to} ${b})`;
  const btn = (from, to, stop) => `linear-gradient(to right, ${from} 0%, ${to} ${stop})`;
  const PURPLE = (a, b, alpha = 0.4) => adv(`rgba(156, 123, 251, ${alpha})`, a, `rgba(60, 38, 153, ${alpha})`, b);
  const NAVY = btn("rgba(24, 24, 76, 0.81)", "rgba(20, 12, 39, 0.81)", "51.923%");

  const THEMES = {
    "dark-water": {
      // Tab bar and accent from Figma Tab_Bar_Component (node 3347:10017)
      accent: "rgba(62, 89, 136, 0.6)", tabBar: "#27354e", tabLine: "#fff", card: "rgba(62, 89, 136, 0.15)",
      advisory: "rgba(62, 89, 136, 0.15)",
      badge: ["41.827%", "100%", "#35abeb"],
      // Main button in the accent colour, like the active tab bar button
      button: "rgba(62, 89, 136, 0.6)",
      fade: ONYX, plate: ONYX, ring: GOLD,
    },
    "dark-air": {
      accent: "rgba(148, 58, 31, 0.6)", card: "rgba(118, 62, 32, 0.78)",
      advisory: adv("rgba(123, 166, 251, 0.4)", "3.3654%", "rgba(18, 5, 77, 0.4)", "100%"),
      badge: ["10.577%", "100%", "#fff"],
      button: btn("rgba(76, 37, 24, 0.81)", "rgba(33, 7, 7, 0.81)", "57.212%"),
      fade: "rgba(66, 24, 14, 0.3)", plate: "rgba(66, 24, 14, 0.3)", ring: ["rgba(52, 72, 112, 1)", "rgba(24, 112, 66, 1)", "rgba(62, 32, 128, 1)"],
    },
    "dark-metal": {
      accent: "rgba(150, 150, 150, 0.4)", card: "rgba(31, 34, 43, 0.5)",
      advisory: PURPLE("0%", "44.231%"),
      badge: ["20.192%", "60.096%", "#35abeb"],
      button: btn("rgba(24, 24, 76, 0.63)", "rgba(20, 12, 39, 0.63)", "100%"),
      fade: ONYX, plate: ONYX, ring: ["rgba(125, 93, 30, 1)", "rgba(244, 125, 35, 1)"],
    },
    "dark-earth": {
      accent: "rgba(104, 133, 54, 0.4)", card: "rgba(13, 21, 56, 0.5)",
      advisory: PURPLE("41.827%", "100%"),
      badge: ["41.827%", "100%", "#35abeb"],
      button: NAVY, fade: ONYX, plate: ONYX, ring: GOLD,
    },
    "dark-fire": {
      accent: "rgba(130, 117, 152, 0.4)", card: "rgba(18, 28, 62, 0.5)",
      advisory: adv("rgba(25, 55, 88, 0.4)", "4.8077%", "rgba(34, 19, 98, 0.4)", "57.212%"),
      badge: ["15.865%", "100%", "#81c5ea"],
      button: btn("rgba(43, 22, 25, 0.81)", "rgba(38, 3, 4, 0.81)", "51.442%"),
      fade: "rgba(49, 19, 13, 0.3)", plate: "rgba(49, 19, 13, 0.3)", ring: GOLD,
    },
    // Tuned to its teal sea picture: teal glass and sea mist, with one warm coral/sand
    // accent across from teal on the colour wheel (it pairs with the golden timer ring)
    "light-water": {
      accent: "rgba(30, 44, 68, 0.92)", card: "rgba(22, 96, 124, 0.42)",
      advisory: adv("rgba(96, 196, 200, 0.42)", "0%", "rgba(16, 64, 104, 0.5)", "100%"),
      badge: ["0%", "100%", "rgba(255, 255, 255, 0.7)"],
      button: btn("rgba(240, 190, 150, 0.92)", "rgba(222, 142, 116, 0.92)", "100%"), buttonLine: "rgba(255, 236, 220, 0.9)", buttonInk: "#2a1a14",
      fade: "rgba(12, 52, 72, 0.35)", plate: "rgba(12, 52, 72, 0.35)", ring: GOLD,
    },
    "light-air": {
      // From the Figma "Light Air · now" Home screen: see-through coffee cards, a coffee bar
      accent: "rgba(113, 80, 58, 0.95)", card: "rgba(219, 181, 144, 0.54)", line: "rgba(118, 85, 62, 1)",
      advisory: "rgba(219, 181, 144, 0.54)", advisoryLine: "rgba(118, 85, 62, 1)",
      badge: ["56.731%", "100%", "rgba(53, 171, 235, 0.6)"],
      button: "rgba(113, 80, 58, 0.95)", buttonLine: "rgba(255, 255, 255, 0.6)", buttonInk: "#fff",
      fade: "rgba(124, 87, 75, 0.3)", plate: "rgba(124, 87, 75, 0.3)", ring: ["#55669a", "#3d7850", "#6852b1"],
      ink: "dark", sub: "rgba(124, 87, 75, 0.6)",
    },
    "light-metal": {
      accent: "rgba(0, 0, 0, 0.6)", card: "rgba(72, 74, 83, 0.5)", line: "rgba(0, 0, 0, 0.6)",
      advisory: adv("rgba(180, 164, 223, 0.4)", "3.3654%", "rgba(58, 47, 103, 0.4)", "64.423%"), advisoryLine: "rgba(0, 0, 0, 0.6)",
      badge: ["18.269%", "58.173%", "#000"],
      button: btn("rgba(98, 98, 99, 0.81)", "rgba(124, 120, 131, 0.81)", "51.923%"), buttonLine: "#000", buttonInk: "#000",
      fade: "rgba(85, 85, 91, 0.3)", plate: "rgba(85, 85, 91, 0.3)", ring: ["rgba(179, 131, 35, 1)", "rgba(128, 80, 225, 1)"],
      ink: "dark", sub: "rgba(0, 0, 0, 0.6)",
    },
    "light-earth": {
      accent: "rgba(13, 7, 62, 0.6)", card: "rgba(42, 56, 13, 0.5)",
      advisory: adv("rgba(50, 66, 146, 0.6)", "1.4423%", "rgba(13, 6, 44, 0.6)", "49.519%"),
      badge: ["41.827%", "100%", "#35abeb"],
      button: NAVY, fade: ONYX, plate: ONYX, ring: GOLD,
    },
    "light-fire": {
      accent: "rgba(74, 15, 17, 0.6)", card: "rgba(34, 12, 7, 0.5)",
      advisory: PURPLE("13.462%", "50%"),
      badge: ["0%", "100%", "#35abeb"],
      button: btn("rgba(76, 24, 27, 0.81)", "rgba(39, 12, 12, 0.81)", "83.654%"),
      fade: ONYX, plate: ONYX, ring: GOLD,
    },
  };

  const NAMES = Object.keys(THEMES);

  // Is a colour light? (dark icons go on a light tab bar)
  const isLight = (rgba) => {
    const [r, g, b] = rgba.match(/[\d.]+/g).map(Number);
    return r * 0.3 + g * 0.59 + b * 0.11 > 160;
  };

  function set(name) {
    const t = THEMES[name] || THEMES["dark-earth"];
    const root = document.documentElement;
    const css = root.style;
    const url = new URL(`assets/themes/${name}.jpg`, document.baseURI).href;
    const dark = t.ink === "dark";
    const vars = {
      "--app-bg": `url("${url}")`,
      "--accent": t.accent,
      "--tab-bar": t.tabBar || t.accent,
      "--tab-line": t.tabLine || "transparent",
      "--card": t.card,
      "--line": t.line || "rgba(255, 255, 255, 0.6)",
      "--advisory": t.advisory,
      "--advisory-line": t.advisoryLine || t.line || "rgba(255, 255, 255, 0.6)",
      "--badge": `linear-gradient(127.8713deg, rgba(53, 171, 235, 0.4) ${t.badge[0]}, rgba(14, 67, 133, 0.4) ${t.badge[1]})`,
      "--badge-line": t.badge[2],
      "--session-button": t.button,
      "--button-line": t.buttonLine || "#fff",
      "--session-ink": t.buttonInk || "#fff",
      "--tab-fade": t.fade,
      "--radar-plate": t.plate,
      "--ring-mid": t.ring[0],
      "--ring-end": t.ring[1],
      "--ring-start": t.ring[2] || "#6C2206",
      "--title-ink": dark ? "#000" : "#fff",
      "--sub-ink": t.sub || "rgba(255, 255, 255, 0.6)",
    };
    for (const k in vars) css.setProperty(k, vars[k]);
    root.dataset.theme = name;
    root.dataset.ink = t.ink || "light";
    root.dataset.tabInk = isLight(t.accent) ? "dark" : "light";
  }

  function current() {
    const s = Store.get();
    return `${s.theme === "light" ? "light" : "dark"}-${s.element || "earth"}`;
  }

  return {
    NAMES,
    apply: () => set(current()),
    preview: (mode, element) => set(`${mode}-${element}`),
    current,
  };
})();
