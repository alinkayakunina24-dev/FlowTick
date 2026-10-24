// Side menu (Figma "Weekly Radiance" drawer, node 3307:4079) — opens from the avatar.
// A glass panel slides in from the left over the current screen: photo, name, streak,
// sync and level, and links to Profile, Smart Reminders, Battle, Settings and Exit.

window.Drawer = (function () {
  // Photos of the cat, each with a little fact
  const CAT = [
    ["cat-2.jpg", "Cheek scratches make her melt instantly. Look at that sleepy face."],
    ["cat-1.jpg", "Her favourite spot: the warmest radiator in the house. A professional napper."],
    ["cat-3.jpg", "The official laundry inspector. Nothing gets folded without her approval."],
    ["cat-4.jpg", "Laptop thief. Work can wait — it's cuddle time."],
    ["cat-5.jpg", "A little dramatic and a lot of character — but still the sweetest."],
  ];

  function open(screen, app) {
    const D = AppData;
    const t = D.today();
    const monday = D.addDays(t, -D.weekday(t));
    const levels = D.elementLevels(monday, t);
    const sync = Math.round(D.ELEMENTS.reduce((s, e) => s + levels[e], 0) / D.ELEMENTS.length);
    const rituals = D.rangeRituals(new Date(t.getFullYear(), 0, 1), t);
    const level = Math.max(1, Math.floor(rituals / 80));
    const titles = ["Seeker", "Seeker", "Wanderer", "Keeper", "Guide", "Sage"];
    const title = titles[Math.min(titles.length - 1, Math.floor(level / 3))];

    const el = document.createElement("div");
    el.className = "drawer";
    el.innerHTML = `
      <div class="drawer__outside"></div>
      <nav class="drawer__panel glass-panel" aria-label="Menu">
        <button class="drawer__photo" type="button" data-gallery aria-label="Photos">
          <img src="${AppShell.avatar()}" alt=""${Store.get().avatar ? ' class="is-own"' : ""} />
        </button>
        <p class="drawer__name">${AppShell.userName()}!</p>
        <p class="drawer__motto">Nurture your light.</p>
        <div class="drawer__stats">
          <div><b>${D.streak(t)}</b>Streak</div>
          <div><b>${sync}%</b>Sync</div>
          <div><b>Lv.${level}</b>${title}</div>
        </div>
        <div class="divider"></div>
        <p class="section-label">NAVIGATION</p>
        <button class="drawer__link" type="button" data-go="profile">Profile</button>
        <button class="drawer__link" type="button" data-go="reminders">Smart Reminder</button>
        <button class="drawer__link" type="button" data-go="battle">Battle with a Friend</button>
        <button class="drawer__link" type="button" data-go="settings">Settings</button>
        <button class="drawer__link" type="button" data-go="exit">Exit</button>
      </nav>
    `;

    function close() {
      el.classList.add("drawer--closing");
      setTimeout(() => el.remove(), 450);
    }

    el.querySelector(".drawer__outside").addEventListener("click", close);

    // The photo opens a little gallery of the cat
    el.querySelector("[data-gallery]").addEventListener("click", () => {
      close();
      Modal.open(screen, {
        title: "Our little light",
        body: `
          <div class="cat-gallery">
            ${CAT.map(([photo, fact]) => `
              <figure class="cat-card">
                <img src="assets/cat/${photo}" alt="" />
                <figcaption>${fact}</figcaption>
              </figure>`).join("")}
          </div>
          <p class="hint">Swipe to see more →</p>
        `,
      });
    });
    el.querySelectorAll("[data-go]").forEach((b) =>
      b.addEventListener("click", () => {
        const target = b.dataset.go;
        close();
        // Exit leads back to the very beginning of Shine
        if (target === "exit") app.go("splash", { transition: "dip" });
        else app.go(target, { transition: "fade", duration: 800, params: { fromMenu: true } });
      })
    );
    screen.appendChild(el);
  }

  // Ask the next main screen to open the menu as soon as it appears
  let pending = false;
  return {
    open,
    reopen: () => (pending = true),
    takePending() {
      const was = pending;
      pending = false;
      return was;
    },
  };
})();
