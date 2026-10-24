// Small HTML helpers for components that repeat across screens

window.UI = {
  // Button_Group_CTA: primary button + "Skip for now" link.
  // Pass link: false to keep the link's space but hide it (as on ONB_12).
  ctaButtons({ primary = "Continue", link = "Skip for now", disabled = false } = {}) {
    const linkHtml = link
      ? `<button class="btn-link" type="button" data-action="skip">${link}</button>`
      : `<span class="btn-link" aria-hidden="true" style="visibility: hidden">Skip for now</span>`;
    return `
      <div class="cta-buttons" data-enter>
        <button class="btn-primary" type="button" data-action="next"${disabled ? " disabled" : ""}>${primary}</button>
        ${linkHtml}
      </div>
    `;
  },

  // Wire the buttons made by ctaButtons()
  onCta(el, { next, skip }) {
    el.querySelector('[data-action="next"]').addEventListener("click", next);
    const skipButton = el.querySelector('[data-action="skip"]');
    if (skipButton && skip) skipButton.addEventListener("click", skip);
  },

  // Gestures on a whole screen: swipe left → next, swipe right → prev,
  // a tap anywhere → tap (only for screens without buttons). Text fields are ignored.
  onGesture(el, { next, prev, tap }) {
    let start = null;
    el.addEventListener("pointerdown", (e) => {
      start = e.target.closest("input, textarea") ? null : { x: e.clientX, y: e.clientY };
    });
    el.addEventListener("pointercancel", () => (start = null));
    el.addEventListener("pointerup", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        if (tap) tap();
      } else if (Math.abs(dx) >= 50 && Math.abs(dx) >= Math.abs(dy) * 1.5) {
        if (dx < 0 && next) next();
        if (dx > 0 && prev) prev();
      }
    });
  },

  escape(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },
};
