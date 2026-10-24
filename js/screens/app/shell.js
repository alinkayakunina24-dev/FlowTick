// Shared parts of the five main app screens (Home, Dashboard, Analytics, Focus, Journal):
// the scrolling page, header, week strip, tab bar and the element stat rows.

window.AppShell = (function () {
  // Calendar icon from Figma, inline so its fill follows the theme card colour
  const CALENDAR_ICON = `<svg class="calendar-icon" width="48" height="44" viewBox="0 0 60 54.8571" fill="none" aria-hidden="true"> <path d="M26.667 0.5H33.333C34.1372 0.5 34.9156 0.499879 35.6689 0.500977C35.9183 0.50134 36.054 0.502544 36.1475 0.515625H36.1484C36.1492 0.520333 36.1516 0.525648 36.1523 0.53125C36.1653 0.631008 36.167 0.774072 36.167 1.0293V8.57129C36.167 11.6744 38.6163 14.2139 41.667 14.2139C44.7176 14.2137 47.167 11.6743 47.167 8.57129V1.4834C47.167 1.20197 47.1683 1.04272 47.1836 0.932617C47.1842 0.92818 47.1849 0.923838 47.1855 0.919922C47.2868 0.918526 47.4324 0.935641 47.6982 0.970703C51.3791 1.45612 53.8569 2.43408 55.7354 4.36621C57.5821 6.26572 58.5341 8.7641 59.0156 12.4453C59.4988 16.1397 59.5 20.95 59.5 27.4287C59.5 33.9071 59.4988 38.7168 59.0156 42.4111C58.5341 46.0925 57.5821 48.5916 55.7354 50.4912C53.8905 52.3887 51.4669 53.3651 47.8945 53.8594C44.3062 54.3559 39.6329 54.3574 33.333 54.3574H26.667C20.3671 54.3574 15.6938 54.3559 12.1055 53.8594C8.53307 53.3651 6.10951 52.3887 4.26465 50.4912C2.41785 48.5916 1.46586 46.0925 0.984375 42.4111C0.501248 38.7168 0.5 33.9071 0.5 27.4287C0.5 20.95 0.501195 16.1397 0.984375 12.4453C1.46587 8.7641 2.4179 6.26572 4.26465 4.36621C6.14313 2.43408 8.6209 1.45612 12.3018 0.970703C12.5668 0.935753 12.7122 0.918654 12.8135 0.919922C12.8141 0.923881 12.8158 0.928124 12.8164 0.932617C12.8317 1.04272 12.833 1.20197 12.833 1.4834V8.57129C12.833 11.6743 15.2824 14.2137 18.333 14.2139C21.3838 14.2139 23.833 11.6744 23.833 8.57129V1.0293C23.833 0.774072 23.8347 0.631008 23.8477 0.53125C23.8484 0.525707 23.8499 0.520293 23.8506 0.515625H23.8525C23.946 0.502544 24.0817 0.50134 24.3311 0.500977L26.667 0.5ZM16.167 42.8574C16.1668 43.5413 15.6311 44.0713 15 44.0713C14.3689 44.0713 13.8332 43.5413 13.833 42.8574C13.833 42.1734 14.3689 41.6426 15 41.6426C15.6311 41.6426 16.167 42.1734 16.167 42.8574ZM26.167 42.8574C26.1668 43.5413 25.6311 44.0713 25 44.0713C24.3689 44.0713 23.8332 43.5413 23.833 42.8574C23.833 42.1734 24.3689 41.6426 25 41.6426C25.6311 41.6426 26.167 42.1734 26.167 42.8574ZM36.167 42.8574C36.1668 43.5413 35.6311 44.0713 35 44.0713C34.3689 44.0713 33.8332 43.5413 33.833 42.8574C33.833 42.1734 34.3689 41.6426 35 41.6426C35.6311 41.6426 36.167 42.1734 36.167 42.8574ZM46.167 42.8574C46.1668 43.5413 45.6311 44.0713 45 44.0713C44.3689 44.0713 43.8332 43.5413 43.833 42.8574C43.833 42.1734 44.3689 41.6426 45 41.6426C45.6311 41.6426 46.167 42.1734 46.167 42.8574ZM16.167 32.5713C16.167 33.2553 15.6311 33.7861 15 33.7861C14.3689 33.7861 13.833 33.2553 13.833 32.5713C13.8331 31.8874 14.3689 31.3574 15 31.3574C15.6311 31.3574 16.1669 31.8874 16.167 32.5713ZM26.167 32.5713C26.167 33.2553 25.6311 33.7861 25 33.7861C24.3689 33.7861 23.833 33.2553 23.833 32.5713C23.8331 31.8874 24.3689 31.3574 25 31.3574C25.6311 31.3574 26.1669 31.8874 26.167 32.5713ZM36.167 32.5713C36.167 33.2553 35.6311 33.7861 35 33.7861C34.3689 33.7861 33.833 33.2553 33.833 32.5713C33.8331 31.8874 34.3689 31.3574 35 31.3574C35.6311 31.3574 36.1669 31.8874 36.167 32.5713ZM46.167 32.5713C46.167 33.2553 45.6311 33.7861 45 33.7861C44.3689 33.7861 43.833 33.2553 43.833 32.5713C43.8331 31.8874 44.3689 31.3574 45 31.3574C45.6311 31.3574 46.1669 31.8874 46.167 32.5713ZM16.167 22.2861C16.1668 22.9699 15.631 23.5 15 23.5C14.369 23.5 13.8332 22.9699 13.833 22.2861C13.833 21.6021 14.3689 21.0713 15 21.0713C15.6311 21.0713 16.167 21.6021 16.167 22.2861ZM26.167 22.2861C26.1668 22.9699 25.631 23.5 25 23.5C24.369 23.5 23.8332 22.9699 23.833 22.2861C23.833 21.6021 24.3689 21.0713 25 21.0713C25.6311 21.0713 26.167 21.6021 26.167 22.2861ZM36.167 22.2861C36.1668 22.9699 35.631 23.5 35 23.5C34.369 23.5 33.8332 22.9699 33.833 22.2861C33.833 21.6021 34.3689 21.0713 35 21.0713C35.6311 21.0713 36.167 21.6021 36.167 22.2861ZM46.167 22.2861C46.1668 22.9699 45.631 23.5 45 23.5C44.369 23.5 43.8332 22.9699 43.833 22.2861C43.833 21.6021 44.3689 21.0713 45 21.0713C45.6311 21.0713 46.167 21.6021 46.167 22.2861ZM17.167 42.8574C17.167 41.6479 16.2098 40.6426 15 40.6426C13.7902 40.6426 12.833 41.6479 12.833 42.8574C12.8332 44.0668 13.7903 45.0713 15 45.0713C16.2097 45.0713 17.1668 44.0668 17.167 42.8574ZM27.167 42.8574C27.167 41.6479 26.2098 40.6426 25 40.6426C23.7902 40.6426 22.833 41.6479 22.833 42.8574C22.8332 44.0668 23.7903 45.0713 25 45.0713C26.2097 45.0713 27.1668 44.0668 27.167 42.8574ZM37.167 42.8574C37.167 41.6479 36.2098 40.6426 35 40.6426C33.7902 40.6426 32.833 41.6479 32.833 42.8574C32.8332 44.0668 33.7903 45.0713 35 45.0713C36.2097 45.0713 37.1668 44.0668 37.167 42.8574ZM47.167 42.8574C47.167 41.6479 46.2098 40.6426 45 40.6426C43.7902 40.6426 42.833 41.6479 42.833 42.8574C42.8332 44.0668 43.7903 45.0713 45 45.0713C46.2097 45.0713 47.1668 44.0668 47.167 42.8574ZM17.167 32.5713C17.1669 31.3618 16.2098 30.3574 15 30.3574C13.7902 30.3574 12.8331 31.3618 12.833 32.5713C12.833 33.7808 13.7902 34.7861 15 34.7861C16.2098 34.7861 17.167 33.7808 17.167 32.5713ZM27.167 32.5713C27.1669 31.3618 26.2098 30.3574 25 30.3574C23.7902 30.3574 22.8331 31.3618 22.833 32.5713C22.833 33.7808 23.7902 34.7861 25 34.7861C26.2098 34.7861 27.167 33.7808 27.167 32.5713ZM37.167 32.5713C37.1669 31.3618 36.2098 30.3574 35 30.3574C33.7902 30.3574 32.8331 31.3618 32.833 32.5713C32.833 33.7808 33.7902 34.7861 35 34.7861C36.2098 34.7861 37.167 33.7808 37.167 32.5713ZM47.167 32.5713C47.1669 31.3618 46.2098 30.3574 45 30.3574C43.7902 30.3574 42.8331 31.3618 42.833 32.5713C42.833 33.7808 43.7902 34.7861 45 34.7861C46.2098 34.7861 47.167 33.7808 47.167 32.5713ZM17.167 22.2861C17.167 21.0766 16.2098 20.0713 15 20.0713C13.7902 20.0713 12.833 21.0766 12.833 22.2861C12.8332 23.4955 13.7903 24.5 15 24.5C16.2097 24.5 17.1668 23.4955 17.167 22.2861ZM27.167 22.2861C27.167 21.0766 26.2098 20.0713 25 20.0713C23.7902 20.0713 22.833 21.0766 22.833 22.2861C22.8332 23.4955 23.7903 24.5 25 24.5C26.2097 24.5 27.1668 23.4955 27.167 22.2861ZM37.167 22.2861C37.167 21.0766 36.2098 20.0713 35 20.0713C33.7902 20.0713 32.833 21.0766 32.833 22.2861C32.8332 23.4955 33.7903 24.5 35 24.5C36.2097 24.5 37.1668 23.4955 37.167 22.2861ZM47.167 22.2861C47.167 21.0766 46.2098 20.0713 45 20.0713C43.7902 20.0713 42.833 21.0766 42.833 22.2861C42.8332 23.4955 43.7903 24.5 45 24.5C46.2097 24.5 47.1668 23.4955 47.167 22.2861Z" style="fill: var(--card); stroke: var(--stroke-border-active)"/> </svg>`;

  // Tab bar order as in Figma. Icons use currentColor: 20% white when idle, white when active.
  const TABS = [
    {
      id: "analytics",
      label: "Analytics",
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5576 3.7666C13.1884 3.88285 13.8049 4.08533 14.3896 4.37207C15.6466 4.98851 16.7046 5.96749 17.4346 7.19141C18.1644 8.41542 18.5336 9.83232 18.4971 11.2695C18.4603 12.7068 18.0196 14.1024 17.2285 15.2852C16.4373 16.4678 15.3302 17.3888 14.0439 17.9365C12.7578 18.484 11.3447 18.6367 9.97656 18.377C8.60833 18.117 7.34071 17.4545 6.32812 16.4688C6.12729 16.2732 5.93938 16.0649 5.7627 15.8477L5.80469 15.8359C5.9712 16.0383 6.14732 16.2343 6.33691 16.4189C7.34405 17.3995 8.60872 18.0604 9.97656 18.3203C11.3446 18.5801 12.7575 18.4267 14.042 17.8799C15.3264 17.3329 16.4271 16.4153 17.2119 15.2422C17.9476 14.1422 18.3773 12.8597 18.458 11.5332L18.4697 11.2676C18.5059 9.84712 18.1406 8.44496 17.417 7.23145C16.6933 6.01782 15.6411 5.04292 14.3867 4.42773C13.8081 4.14404 13.198 3.94349 12.5732 3.82715L12.5576 3.7666ZM8.26074 1.51953C8.30057 1.61399 8.33869 1.75564 8.40625 2.01465L10.5361 10.1797C10.6023 10.4332 10.6383 10.5768 10.6514 10.6807C10.6528 10.6918 10.6517 10.7019 10.6523 10.71C10.6472 10.7124 10.6423 10.7169 10.6357 10.7197C10.5442 10.759 10.4081 10.798 10.1602 10.8662L2.21094 13.0537C1.95766 13.1234 1.82208 13.1595 1.72559 13.1709C1.72366 13.1711 1.72153 13.1707 1.71973 13.1709C1.71921 13.1693 1.71831 13.1677 1.71777 13.166C1.68966 13.0782 1.66755 12.9476 1.62793 12.6982C1.47372 11.7278 1.45858 10.7373 1.58398 9.75879C1.75218 8.4465 2.16981 7.18137 2.81348 6.03613C3.45716 4.89087 4.31424 3.88778 5.33398 3.08398C6.09421 2.4848 6.9342 2.005 7.82617 1.6582C8.05134 1.57067 8.1695 1.5259 8.25391 1.50684C8.25566 1.51076 8.25877 1.51487 8.26074 1.51953Z" stroke="currentColor"/></svg>`,
    },
    {
      id: "dashboard",
      label: "Tasks",
      icon: `<svg width="23" height="20" viewBox="0 0 23 20" fill="currentColor"><path d="M17.9677 15.963C18.2528 15.963 18.4839 16.1951 18.4839 16.4815C18.4839 16.7679 18.2528 17 17.9677 17H3.51613C3.23108 17 3 16.7679 3 16.4815C3 16.1951 3.23108 15.963 3.51613 15.963H17.9677Z"/><path d="M17.9677 10.7778C18.2528 10.7778 18.4839 11.0099 18.4839 11.2963C18.4839 11.5827 18.2528 11.8148 17.9677 11.8148H3.51613C3.23108 11.8148 3 11.5827 3 11.2963C3 11.0099 3.23108 10.7778 3.51613 10.7778H17.9677Z"/><path d="M12.8397 5.59259C12.8847 5.95496 12.976 6.30252 13.1079 6.62963H3.51613C3.23108 6.62963 3 6.39748 3 6.11111C3 5.82474 3.23108 5.59259 3.51613 5.59259H12.8397Z"/><path d="M17.9677 5.59259C18.2528 5.59259 18.4839 5.82474 18.4839 6.11111C18.4839 6.39748 18.2528 6.62963 17.9677 6.62963H15.5736C15.268 6.35935 15.0433 6.00094 14.9385 5.59259H17.9677Z"/><path d="M19 5.07407C19 6.21955 18.0757 7.14815 16.9355 7.14815C15.7953 7.14815 14.871 6.21955 14.871 5.07407C14.871 3.92859 15.7953 3 16.9355 3C18.0757 3 19 3.92859 19 5.07407Z"/></svg>`,
    },
    {
      id: "home",
      label: "Home",
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 1.5C14.6944 1.5 18.5 5.30558 18.5 10C18.5 14.6944 14.6944 18.5 10 18.5C5.30558 18.5 1.5 14.6944 1.5 10C1.5 5.30558 5.30558 1.5 10 1.5Z" stroke="currentColor"/><circle cx="10" cy="10" r="6" fill="currentColor"/></svg>`,
    },
    {
      id: "focus",
      label: "Focus",
      icon: `<svg width="14" height="20" viewBox="0 0 14 21" fill="none"><path d="M7 20.0009V12.0009M13.5 11.0012C13.4999 4.42848 7.76904 0.941391 7.06965 0.540299C7.02591 0.515213 6.97409 0.515213 6.93035 0.540299C6.23096 0.941389 0.500133 4.42848 0.5 11.0012C0.5 14.5911 3.41015 17.5012 7 17.5012C10.5899 17.5012 13.5 14.5911 13.5 11.0012ZM10.4999 12.0008C10.4999 7.46539 7.62002 4.98689 7.08494 4.56552C7.03459 4.52587 6.96529 4.52587 6.91493 4.56552C6.37986 4.98689 3.5 7.46538 3.49994 12.0008L3.50482 12.1805C3.59842 14.0299 5.12728 15.5008 6.99994 15.5008C8.87262 15.5008 10.4015 14.0299 10.4951 12.1805L10.4999 12.0008Z" stroke="currentColor"/><circle cx="7" cy="12" r="0.5" fill="currentColor" stroke="currentColor"/></svg>`,
    },
    {
      id: "journal",
      label: "Journal",
      icon: `<svg width="19" height="20" viewBox="0 0 19 20" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M2 5.5H6M2 9.5H6M2 13.5H6"/><path d="M8 1.5H13C13.9569 1.5 14.6244 1.50066 15.1279 1.56836C15.6171 1.63413 15.876 1.75494 16.0605 1.93945C16.2451 2.12396 16.3659 2.38289 16.4316 2.87207C16.4993 3.37563 16.5 4.04308 16.5 5V14C16.5 14.9569 16.4993 15.6244 16.4316 16.1279C16.3659 16.6171 16.2451 16.876 16.0605 17.0605C15.876 17.2451 15.6171 17.3659 15.1279 17.4316C14.6244 17.4993 13.9569 17.5 13 17.5H8C7.04308 17.5 6.37563 17.4993 5.87207 17.4316C5.38289 17.3659 5.12396 17.2451 4.93945 17.0605C4.75494 16.876 4.63413 16.6171 4.56836 16.1279C4.50066 15.6244 4.5 14.9569 4.5 14V5C4.5 4.04308 4.50066 3.37563 4.56836 2.87207C4.63413 2.38289 4.75494 2.12396 4.93945 1.93945C5.12396 1.75494 5.38289 1.63413 5.87207 1.56836C6.37563 1.50066 7.04308 1.5 8 1.5Z"/></svg>`,
    },
  ];

  const ELEMENTS = ["water", "air", "metal", "earth", "fire"];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Monday of the current week and today's index (0 = Monday)
  function currentWeek() {
    const today = new Date();
    const index = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - index);
    return { monday, index, today };
  }

  function monthLabel(date = new Date()) {
    return `${date.toLocaleString("en", { month: "long" }).toUpperCase()} ${date.getFullYear()}`;
  }

  // Analytics_Card_Header: avatar, title block, calendar icon. `date` replaces the month line.
  function header({ title, subtitle, boldSubtitle = false, date }) {
    return `
      <header class="app-header" data-enter>
        <button class="app-header__avatar" type="button" aria-label="Profile and settings">
          <img src="${avatar()}" alt=""${Store.get().avatar ? ' class="is-own"' : ""} width="48" height="48" />
        </button>
        <div class="app-header__text">
          <h1 class="app-header__title">${title}</h1>
          <p class="app-header__subtitle${boldSubtitle ? " app-header__subtitle--bold" : ""}">${subtitle}</p>
          <p class="app-header__date">${date || monthLabel()}</p>
        </div>
        <button class="app-header__calendar" type="button" aria-label="Calendar">
          ${CALENDAR_ICON}
        </button>
      </header>
    `;
  }

  // Calendar_Days_Row: the current week, `selected` day highlighted (today by default).
  // Days that have already come (up to today) get a dot; the days ahead stay empty.
  function weekStrip({ spread = false, selected = AppData.today() } = {}) {
    const { monday, index } = currentWeek();
    const cells = DAYS.map((day, i) => {
      const date = AppData.addDays(AppData.today(), i - index);
      return `
        <button class="week-day" type="button" data-date="${AppData.key(date)}"
                aria-pressed="${AppData.key(date) === AppData.key(selected)}">
          <span class="week-day__name">${day}</span>
          <span class="week-day__date">${date.getDate()}</span>
          <span class="week-day__dot">${i <= index ? "•" : "&nbsp;"}</span>
        </button>
      `;
    }).join("");
    return `
      <div class="week" data-enter>
        <div class="week__days${spread ? " week__days--spread" : ""}">${cells}</div>
        ${divider()}
      </div>
    `;
  }

  function divider() {
    return `<div class="divider" role="presentation"></div>`;
  }

  function label(text) {
    return `<p class="section-label">${text}</p>`;
  }

  // Status of an element level: below 50% Rest, 90% and up Peak, else Stable
  function levelTag(value) {
    if (value < 50) return { tag: "Rest", tone: "red" };
    if (value >= 90) return { tag: "Peak", tone: "earth" };
    return { tag: "Stable", tone: "yellow" };
  }

  const capital = (word) => word[0].toUpperCase() + word.slice(1);

  // Element_Stat_Row: icon + name, progress bar with a glowing planet, value and status tag.
  // Tapping a row shows a notification about that element (see wireContent()).
  function statRows(rows) {
    return rows.map(({ element, value, tag, tone, change, period }) => `
      <div class="stat-row el-${element}" role="button" tabindex="0"
           data-element="${element}" data-value="${value}"
           ${change === undefined ? "" : `data-change="${change}" data-period="${period}"`}>
        <span class="stat-row__name">
          <img src="assets/icons/element-${element}.png" alt="" width="20" height="23" />
          <span>${capital(element)}</span>
        </span>
        <span class="stat-row__bar" style="--value: ${value}%">
          <span class="stat-row__fill"></span>
          <span class="stat-row__dot planet"></span>
        </span>
        <span class="stat-row__values">
          <span class="stat-row__value">${value}%</span>
          <span class="tag tag--${tone}">${tag}</span>
        </span>
      </div>
    `).join("");
  }

  // Elemental balance card: harmony on top, then a row per element
  function balanceCard(levels, tags = (element, value) => levelTag(value)) {
    const values = AppData.ELEMENTS.map((e) => levels[e]);
    const harmony = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    return `
      <div class="card card--rounded">
        <div class="card__row"><span>Overall Harmony</span><span>${harmony}%</span></div>
        ${divider()}
        <div class="stat-rows">
          ${statRows(AppData.ELEMENTS.map((element) => ({ element, value: levels[element], ...tags(element, levels[element]) })))}
        </div>
      </div>
    `;
  }

  // One line of advice about the two weakest elements
  function balanceTip(levels) {
    const low = [...AppData.ELEMENTS].sort((a, b) => levels[a] - levels[b]).slice(0, 2);
    return `Tip: ${capital(low[0])} &amp; ${capital(low[1])} need attention. ${ADVICE[low[0]]}`;
  }

  // Today's focus: minutes of focus today against a 3-hour goal
  function focusCard() {
    const minutes = AppData.focusMinutes(AppData.today());
    const value = Math.min(100, Math.round((minutes / 180) * 100));
    return `
      <div class="card focus-card">
        <p class="focus-card__text">Deep Work  ·  Air &amp; Fire<br /><span>${formatMinutes(minutes)} of 3h · Focusing on Explore &amp; Create</span></p>
        <div class="focus-card__progress">
          <span class="progress progress--mixed" style="--value: ${value}%"><span class="progress__fill"></span><span class="progress__dot planet"></span></span>
          <span class="focus-card__value">${value}%</span>
        </div>
        ${minutes < 180 ? `
          <button class="pill-button el-air focus-card__go" type="button" data-focus-go="${180 - minutes}">
            Focus the remaining ${formatMinutes(180 - minutes)}  →
          </button>` : '<p class="hint">Goal reached — well done ✨</p>'}
      </div>
    `;
  }

  function formatMinutes(total) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
  }

  // Tab_Bar_Component
  function tabBar(active) {
    const items = TABS.map((tab) => `
      <button class="tab-bar__item" type="button" data-tab="${tab.id}" aria-label="${tab.label}"
              aria-current="${tab.id === active ? "page" : "false"}">${tab.icon}</button>
    `).join("");
    return `<nav class="tab-bar" data-transition="static" aria-label="Main">${items}</nav>`;
  }

  // The whole screen: scrolling page with the content, and the tab bar on top
  let lastTab = "home";

  function screen({ tab, content }) {
    lastTab = tab;
    const el = document.createElement("section");
    el.className = `screen app app--${tab}`;
    el.innerHTML = `
      <div class="app__scroll" data-scroll>
        <div class="app__content">${content}</div>
      </div>
      <!-- Background half-sun: stays in the middle of the screen while the page scrolls -->
      <div class="mandala-deco app__deco" data-spin="240" data-transition="static"></div>
      <div class="app__fade" data-transition="static"></div>
      ${tabBar(tab)}
    `;
    return el;
  }

  // Advice for each element when it runs low or steady
  const ADVICE = {
    water: "Take a Stillness session tonight and drink more water.",
    air: "Try a few minutes of breath work between tasks.",
    metal: "Step away from screens for a short, quiet break.",
    earth: "Go for a slow walk outside and ground yourself.",
    fire: "Plan an early night — your fire needs fuel, not more effort.",
  };

  function elementNotice(screen, row) {
    const { element } = row.dataset;
    const value = Number(row.dataset.value);
    // Analytics rows show the change against the previous period: the notice is about that
    if (row.dataset.change !== undefined) return changeNotice(screen, element, value, Number(row.dataset.change), row.dataset.period);
    const { tone } = levelTag(value);
    const name = capital(element);
    const messages = {
      red: {
        title: `${name} needs rest · ${value}%`,
        text: `Your schedule shows you've been overworking lately. Slow down and give yourself time to recover. ${ADVICE[element]}`,
      },
      yellow: {
        title: `${name} is steady · ${value}%`,
        text: `You're holding a good rhythm. Keep it up — a little extra care will lift it higher. ${ADVICE[element]}`,
      },
      earth: {
        title: `${name} is at its peak · ${value}%`,
        text: "Everything is going well — keep going in the same spirit, but don't forget about the other elements.",
      },
    };
    const glow = { red: "red", yellow: "yellow", earth: "green" }[tone];
    Notice.show(screen, { ...messages[tone], icon: `assets/app/element-${element}-small.svg`, element, tone: glow });
  }

  // Up = good news (green), down = needs care (red), no change = steady (yellow)
  function changeNotice(screen, element, value, change, period) {
    const name = capital(element);
    const before = value - change;
    const icon = `assets/app/element-${element}-small.svg`;
    if (change > 0) {
      Notice.show(screen, {
        title: `${name} grew +${change}% · now ${value}%`,
        text: `It was ${before}% ${period} and now it's ${value}%. ${value < 50 ? "Good progress — it's still on the low side, so keep giving it care." : "Beautiful progress — keep going in the same spirit."}`,
        icon, element, tone: "green",
      });
    } else if (change < 0) {
      Notice.show(screen, {
        title: `${name} dropped ${change}% · now ${value}%`,
        text: `It was ${before}% ${period} and now it's ${value}%. Slow down a little and give it attention. ${ADVICE[element]}`,
        icon, element, tone: "red",
      });
    } else {
      Notice.show(screen, {
        title: `${name} is steady · ${value}%`,
        text: `The same as ${period}. A little extra care will lift it higher.`,
        icon, element, tone: "yellow",
      });
    }
  }

  // Tab bar navigation (it stays when the content is redrawn)
  function wire(el, app, options) {
    // Coming back from a page opened in the side menu: show the menu again
    if (Drawer.takePending()) setTimeout(() => el.isConnected && Drawer.open(el, app), 700);
    el.querySelectorAll(".tab-bar__item").forEach((item) => {
      item.addEventListener("click", () => {
        if (item.getAttribute("aria-current") === "page") return;
        app.go(item.dataset.tab, { transition: "fade", duration: 1200, light: true });
      });
    });
    wireContent(el, app, options);
  }

  // Header buttons, the element rows and the week strip.
  // onDay(date): what to do when a day of the week strip is tapped.
  function wireContent(el, app, { onDay } = {}) {
    el.querySelector(".app-header__calendar").addEventListener("click", () => Calendar.open(el));
    el.querySelectorAll("[data-focus-go]").forEach((b) =>
      b.addEventListener("click", () =>
        app.go("timer", { transition: "fade", duration: 900, params: { mode: "focus", minutes: Math.min(180, Number(b.dataset.focusGo)) } })
      )
    );
    el.querySelector(".app-header__avatar").addEventListener("click", () => Drawer.open(el, app));
    el.querySelectorAll(".stat-row").forEach((row) => {
      row.addEventListener("click", () => elementNotice(el, row));
      row.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && elementNotice(el, row));
    });
    el.querySelectorAll(".week__days").forEach((row) => {
      const days = row.querySelectorAll(".week-day");
      days.forEach((day) =>
        day.addEventListener("click", () => {
          days.forEach((d) => d.setAttribute("aria-pressed", String(d === day)));
          if (onDay) onDay(AppData.fromKey(day.dataset.date));
        })
      );
    });
  }

  // Redraw the page content (after the data changed), keeping the scroll position
  function refresh(el, app, content, options) {
    app.settle(el);
    const scroll = el.querySelector(".app__scroll");
    const top = scroll.scrollTop;
    el.querySelector(".app__content").innerHTML = content;
    scroll.scrollTop = top;
    wireContent(el, app, options);
  }

  const moodOn = (date) => AppData.moodOn(date);

  // The user's own photo from Profile, or the cat from the design
  function avatar() {
    return Store.get().avatar || "assets/app/avatar.jpg";
  }

  function userName() {
    return UI.escape(Store.get().name || "friend");
  }

  return {
    CALENDAR_ICON,
    ELEMENTS, DAYS, ADVICE, currentWeek, monthLabel, header, weekStrip, divider, label, levelTag, capital,
    lastTab: () => lastTab,
    statRows, balanceCard, balanceTip, focusCard, formatMinutes, screen, wire, wireContent, refresh, userName, avatar, moodOn,
  };
})();
