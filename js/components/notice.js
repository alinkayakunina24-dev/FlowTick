// Notification — a glass panel that drops from the top of the screen.
// Hides by itself after a few seconds, or on any tap anywhere. Only one at a time.
//
// Notice.show(screen, { title, text, list, extra, icon, element, tone })
//   icon     image shown in the round badge
//   element  water | air | metal | earth | fire | red — colours the badge
//   tone     red | yellow | green — tints and lights up the whole panel
//   list     optional bullet points, extra — optional line under them

window.Notice = (function () {
  let current = null;

  // Any tap anywhere closes the notification
  function onAnyTap() {
    hide(current);
  }

  function hide(el) {
    if (!el || el.classList.contains("notice--closing")) return;
    document.removeEventListener("pointerdown", onAnyTap, true);
    el.classList.add("notice--closing");
    el.addEventListener("animationend", () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 600);
    if (current === el) current = null;
  }

  function show(screen, { title, text, list, extra, icon, element, tone, duration = 4000 }) {
    hide(current);

    const el = document.createElement("div");
    el.className = `notice glass-panel${element ? ` el-${element}` : ""}`;
    if (tone) el.dataset.tone = tone;
    el.setAttribute("role", "status");
    el.innerHTML = `
      ${icon ? `<span class="notice__icon"><img src="${icon}" alt="" /></span>` : ""}
      <div class="notice__body">
        <p class="notice__title">${title}</p>
        ${text ? `<p class="notice__text">${text}</p>` : ""}
        ${list ? `<ul class="notice__list">${list.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
        ${extra ? `<p class="notice__extra">${extra}</p>` : ""}
      </div>
    `;
    screen.appendChild(el);
    current = el;
    // Listen from the next tick, so the tap that opened it doesn't close it
    setTimeout(() => current === el && document.addEventListener("pointerdown", onAnyTap, true));
    setTimeout(() => hide(el), duration);
  }

  return { show, hide: () => hide(current) };
})();
