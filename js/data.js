// App data shared by all screens: habits and their marks per day, tasks, journal
// entries and focus sessions. Every chart is calculated from here, so a change
// made on one screen shows up everywhere.
//
// Past days are filled with sample history (always the same for a given date),
// and everything the user does is saved in localStorage on top of it.

window.AppData = (function () {
  const KEY = "shine.data";
  const ELEMENTS = ["water", "air", "metal", "earth", "fire"];
  const DAY = 86400000;

  // ---------- Dates ----------

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = () => startOfDay(new Date());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromKey = (k) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const weekday = (d) => (d.getDay() + 6) % 7; // 0 = Monday
  const isFuture = (d) => startOfDay(d) > today();
  const isToday = (d) => key(d) === key(today());

  // Stable pseudo-random number 0..1 for any text, so sample history never changes
  function seeded(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
  }

  // ---------- Catalogue of practices per element ----------

  const PRACTICES = {
    water: [
      {
        title: "Morning Meditation",
        intention: "Rest & Heal",
        why: "Ten quiet minutes lower stress hormones, calm the nervous system and help you start the day from stillness instead of rush.",
        steps: ["Sit comfortably, back straight, eyes closed.", "Breathe slowly through the nose and count each exhale up to ten.", "When a thought comes, notice it and return to the breath.", "Finish with three deep breaths and a moment of gratitude."],
      },
      {
        title: "Evening Bath Ritual",
        intention: "Rest & Heal",
        why: "Warm water relaxes the muscles and signals the body that the day is over, so you fall asleep faster and sleep deeper.",
        steps: ["Run a warm bath and dim the lights.", "Add salt or a few drops of lavender oil.", "Stay for 15–20 minutes without your phone.", "Drink a glass of water afterwards."],
      },
      {
        title: "Gratitude Pause",
        intention: "Rest & Heal",
        why: "Naming three good things a day trains attention towards calm and makes difficult days feel lighter.",
        steps: ["Stop for two minutes wherever you are.", "Name three things you're grateful for today.", "Feel each one for a breath before moving on."],
      },
    ],
    air: [
      {
        title: "Deep Breathing",
        intention: "Explore & Learn",
        why: "Slow breathing brings more oxygen to the brain and clears the head before learning or creative work.",
        steps: ["Breathe in for 4 counts.", "Hold for 4 counts.", "Breathe out for 6 counts.", "Repeat for 5 minutes."],
      },
      {
        title: "Learn 10 New Words",
        intention: "Explore & Learn",
        why: "Small daily learning keeps the mind curious and builds a big vocabulary over a year without effort.",
        steps: ["Pick ten words in the language you're learning.", "Say each one out loud in a sentence.", "Review yesterday's words before you finish."],
      },
      {
        title: "Podcast Walk",
        intention: "Explore & Learn",
        why: "Moving while listening helps new ideas stick and gives you fresh air at the same time.",
        steps: ["Choose an episode on something new to you.", "Walk at an easy pace while you listen.", "Write down one idea you want to remember."],
      },
    ],
    metal: [
      {
        title: "Evening Walk",
        intention: "Deep Focus",
        why: "A walk without screens resets attention after a long day and makes the next morning's focus sharper.",
        steps: ["Leave your phone in your pocket on silent.", "Walk for 30 minutes at a steady pace.", "Notice five things you can see, hear and smell."],
      },
      {
        title: "Inbox Zero",
        intention: "Deep Focus",
        why: "Clearing open loops frees mental space, so your attention isn't split between tasks.",
        steps: ["Set a 20-minute timer.", "Reply, archive or schedule every message.", "Close the inbox when the timer ends."],
      },
      {
        title: "Desk Declutter",
        intention: "Deep Focus",
        why: "A clear workspace means fewer visual distractions and an easier start to deep work.",
        steps: ["Remove everything from the desk.", "Put back only what you use daily.", "Wipe the surface and open a window."],
      },
    ],
    earth: [
      {
        title: "Read One Chapter",
        intention: "Build Routine",
        why: "A chapter a day adds up to dozens of books a year and is a calm, steady anchor in your routine.",
        steps: ["Choose the same time and place every day.", "Read one chapter without your phone nearby.", "Note one thought from the chapter."],
      },
      {
        title: "Morning Stretching",
        intention: "Build Routine",
        why: "Gentle stretching wakes up the body, improves posture and makes a reliable start to the day.",
        steps: ["Stand tall and roll your shoulders back.", "Reach up, then fold forward slowly.", "Hold each stretch for five breaths."],
      },
      {
        title: "Cook at Home",
        intention: "Build Routine",
        why: "Cooking your own meal grounds you in the present moment and keeps your body well fed.",
        steps: ["Pick a simple recipe with fresh ingredients.", "Cook without rushing — enjoy the process.", "Eat at the table, away from screens."],
      },
    ],
    fire: [
      {
        title: "Danish Lesson",
        intention: "Act & Execute",
        why: "Short, regular lessons build momentum — progress you can feel keeps the motivation burning.",
        steps: ["Open your course where you left off.", "Do one lesson and its exercises.", "Say three new phrases out loud."],
      },
      {
        title: "HIIT Workout",
        intention: "Act & Execute",
        why: "Twenty intense minutes boost energy and mood for the rest of the day.",
        steps: ["Warm up for 3 minutes.", "Do 8 rounds of 30 seconds hard, 30 seconds easy.", "Cool down and stretch."],
      },
      {
        title: "Creative Sketch",
        intention: "Act & Execute",
        why: "Making something with your hands turns ideas into action and lights up your creative fire.",
        steps: ["Take paper and one pen.", "Sketch for 15 minutes without erasing.", "Keep the page, even if it isn't perfect."],
      },
    ],
  };

  // How often each habit was done in the sample history
  const HISTORY_RATE = { water: 0.3, air: 0.82, metal: 0.95, earth: 0.9, fire: 0.68 };

  const DEFAULT_HABITS = [
    { id: "h-water", element: "water", practice: 0, time: "07:30", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: "h-air", element: "air", practice: 0, time: "12:30", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: "h-metal", element: "metal", practice: 0, time: "19:00", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: "h-earth", element: "earth", practice: 0, time: "21:30", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: "h-fire", element: "fire", practice: 0, time: "18:00", days: [0, 1, 2, 3, 4] },
  ];

  // ---------- Sample tasks that move with time ----------
  // The sample tasks are never left behind: every day the old ones drop out and new ones
  // appear for today and the next few days (one missed task stays from yesterday, so
  // "Overdue" still shows how it looks). The user's own tasks are never touched.

  const TASK_POOL = [
    ["Deep work block — finish design report", "earth", "11:00"],
    ["Read one chapter of Atomic Habits", "air", "14:00"],
    ["Evening walk — 30 min", "earth", "18:00"],
    ["Journal entry — reflect on the day", "water", "21:00"],
    ["Morning meditation — 10 min", "water", "08:00"],
    ["Weekly planning session", "metal", ""],
    ["Call with mentor — 45 min", "water", "16:00"],
    ["Grocery run + meal prep", "earth", ""],
    ["Complete Danish lesson — next unit", "fire", "19:00"],
    ["Clear the inbox to zero", "metal", "10:00"],
    ["Stretching & mobility — 15 min", "earth", "07:30"],
    ["Sketch ideas for the new project", "air", "15:00"],
    ["Tidy the desk and workspace", "metal", ""],
    ["Drink 8 glasses of water", "water", ""],
    ["Gym session — strength", "fire", "18:30"],
    ["Listen to a podcast on design", "air", "13:00"],
    ["Plan tomorrow's three priorities", "metal", "20:30"],
    ["Cook a new healthy recipe", "earth", "19:30"],
    ["Call a friend or family member", "water", "17:00"],
    ["Write 300 words of the article", "fire", "09:30"],
    ["Digital detox hour — no screens", "water", "21:30"],
    ["Review the monthly budget", "metal", ""],
    ["Learn 10 new Danish words", "air", "12:30"],
    ["Run 5 km", "fire", "07:00"],
  ];

  const isSample = (t) => t.sample || /^t\d{1,2}$/.test(t.id);

  // A steady mix per day: the same date always gets the same tasks
  function sampleTasksFor(date, count) {
    const k = key(date);
    let h = 0;
    for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const out = [];
    for (let i = 0; out.length < count; i++) {
      const [title, element, time] = TASK_POOL[(h + i * 7) % TASK_POOL.length];
      if (!out.some((t) => t.title === title)) out.push({ id: `s-${k}-${out.length}`, title, date: k, time, element, sample: true });
    }
    return out;
  }

  function refreshSampleTasks(st) {
    const t = today();
    const todayKey = key(t);
    const yesterday = key(addDays(t, -1));
    const before = JSON.stringify(st.tasks);
    // Old samples go: done ones from past days, missed ones older than yesterday
    st.tasks = st.tasks.filter((x) => !isSample(x) || (x.doneAt ? x.date >= todayKey : x.date >= yesterday));
    // New samples come: yesterday (one missed), today and the next three days
    [[-1, 1], [0, 4], [1, 2], [2, 2], [3, 1]].forEach(([offset, count]) => {
      const day = addDays(t, offset);
      if (!st.tasks.some((x) => isSample(x) && x.date === key(day))) st.tasks.push(...sampleTasksFor(day, count));
    });
    if (JSON.stringify(st.tasks) !== before) {
      try {
        localStorage.setItem(KEY, JSON.stringify(st));
      } catch {
        // Storage blocked: fine for this visit
      }
    }
    return st;
  }

  // ---------- Saved state ----------

  let state = refreshSampleTasks(load());
  const listeners = new Set();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && saved.version === 1) return saved;
    } catch {
      // Storage blocked: start fresh
    }
    return {
      version: 1,
      habits: DEFAULT_HABITS,
      marks: {}, // "habitId|YYYY-MM-DD": true/false — the user's own marks
      tasks: seedTasks(),
      entries: [], // the user's own journal entries
      sessions: [], // the user's own focus sessions
    };
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage blocked: keep it for this visit only
    }
    listeners.forEach((fn) => fn());
  }

  function seedTasks() {
    const t = today();
    const at = (n) => key(addDays(t, n));
    return [
      { id: "t1", title: "Review weekly goals & reset intentions", date: at(-1), time: "", element: "metal" },
      { id: "t2", title: "Complete Danish lesson — Unit 4", date: at(-2), time: "", element: "fire" },
      { id: "t3", title: "Deep work block — finish design report", date: at(0), time: "11:00", element: "earth" },
      { id: "t4", title: "Read one chapter of Atomic Habits", date: at(0), time: "14:00", element: "air" },
      { id: "t5", title: "Evening walk — 30 min", date: at(0), time: "18:00", element: "earth" },
      { id: "t6", title: "Journal entry — reflect on the day", date: at(0), time: "21:00", element: "water" },
      { id: "t7", title: "Morning meditation — 10 min", date: at(0), time: "08:00", element: "water", doneAt: key(t) },
      { id: "t8", title: "Weekly planning session", date: at(1), time: "", element: "metal" },
      { id: "t9", title: "Call with mentor — 45 min", date: at(2), time: "", element: "water" },
      { id: "t10", title: "Grocery run + meal prep", date: at(3), time: "", element: "earth" },
    ];
  }

  // ---------- Habits ----------

  function habits() {
    return state.habits.map((h) => ({ ...h, ...PRACTICES[h.element][h.practice] }));
  }

  function habit(id) {
    return habits().find((h) => h.id === id);
  }

  const scheduled = (h, date) => h.days.includes(weekday(date));

  function isDone(id, date) {
    if (isFuture(date)) return false;
    const mark = state.marks[`${id}|${key(date)}`];
    if (mark !== undefined) return mark;
    const h = state.habits.find((x) => x.id === id);
    if (!h || !scheduled(h, date)) return false;
    // Today starts as in the design: meditation and reading already done
    if (isToday(date)) return id === "h-water" || id === "h-earth";
    return seeded(`${id}|${key(date)}`) < HISTORY_RATE[h.element];
  }

  function toggleHabit(id, date) {
    if (isFuture(date)) return;
    state.marks[`${id}|${key(date)}`] = !isDone(id, date);
    save();
  }

  function updateHabit(id, patch) {
    state.habits = state.habits.map((h) => (h.id === id ? { ...h, ...patch } : h));
    save();
  }

  // ---------- Focus sessions ----------

  // Minutes of focus on a day (sample history + sessions the user finished)
  function focusMinutes(date) {
    if (isFuture(date)) return 0;
    const k = key(date);
    const own = state.sessions.filter((s) => s.date === k).reduce((sum, s) => sum + s.minutes, 0);
    let sample = Math.round(40 + seeded(`focus|${k}`) * 110);
    if (isToday(date)) sample = Math.round(sample * Math.min(1, new Date().getHours() / 20));
    return sample + own;
  }

  function breaks(date) {
    if (isFuture(date)) return 0;
    return Math.floor(seeded(`breaks|${key(date)}`) * 3);
  }

  function addSession(minutes, kind) {
    state.sessions.push({ date: key(today()), at: new Date().toISOString(), minutes, kind });
    save();
  }

  // ---------- Journal ----------

  const MOOD_PATTERN = "JJSDJASJJFSAJJJ";
  const MOOD_CODES = { J: "joy", S: "sad", A: "anger", F: "fear", D: "disgust" };
  const SAMPLE_TEXT = {
    joy: ["Felt calm and clear after meditation.", "Grateful and connected. Good day.", "Light and easy, lots of laughter."],
    sad: ["A heavy day. Needed more rest.", "Missed home a little today.", "Quiet and low, but okay."],
    anger: ["Driven. Pushed through resistance.", "Frustrated with work, walked it off.", "Too many things at once."],
    fear: ["Nervous before the presentation.", "Worried about the week ahead.", "Unsure, but took a small step."],
    disgust: ["Didn't like how I spent the evening.", "Tired of the noise around me.", "Need to clean up my space."],
  };

  // Sample entry for a past day (one in the evening)
  function sampleEntry(date) {
    const k = key(date);
    const mood = MOOD_CODES[MOOD_PATTERN[(date.getDate() - 1 + date.getMonth() * 7) % MOOD_PATTERN.length]];
    const texts = SAMPLE_TEXT[mood];
    const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 20, 30 + Math.floor(seeded(k) * 29));
    return { at: at.toISOString(), mood, text: texts[Math.floor(seeded(`t|${k}`) * texts.length)], sample: true };
  }

  // All entries of a day, the latest first
  function entriesOn(date) {
    const k = key(date);
    const own = state.entries.filter((e) => key(new Date(e.at)) === k);
    const list = isFuture(date) || isToday(date) ? own : [...own, sampleEntry(date)];
    return list.sort((a, b) => new Date(b.at) - new Date(a.at));
  }

  function moodOn(date) {
    const list = entriesOn(date);
    return list.length ? list[0].mood : null;
  }

  // The latest entries before now (own and sample), newest first
  function recentEntries(count) {
    const out = [];
    for (let d = today(); out.length < count; d = addDays(d, -1)) out.push(...entriesOn(d));
    return out.slice(0, count);
  }

  function addEntry(mood, text) {
    state.entries.push({ at: new Date().toISOString(), mood, text });
    save();
  }

  // ---------- Tasks ----------

  function tasks() {
    return state.tasks.map((t) => ({ ...t, done: Boolean(t.doneAt) }));
  }

  function toggleTask(id) {
    state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, doneAt: t.doneAt ? null : key(today()) } : t));
    save();
  }

  function addTask(title, date, time, element = "air") {
    state.tasks.push({ id: `t${Date.now()}`, title, date: key(date), time, element });
    save();
  }

  function updateTask(id, patch) {
    state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    save();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    save();
  }

  // ---------- Calculated values ----------

  // Days from `from` to `to` (inclusive) that have already come
  function pastDays(from, to) {
    const out = [];
    const end = startOfDay(to) > today() ? today() : startOfDay(to);
    for (let d = startOfDay(from); d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }

  // Share of planned habits done in a range, per element (0–100)
  function elementLevels(from, to) {
    const days = pastDays(from, to);
    const levels = {};
    state.habits.forEach((h) => {
      const planned = days.filter((d) => scheduled(h, d));
      const done = planned.filter((d) => isDone(h.id, d)).length;
      levels[h.element] = planned.length ? Math.round((done / planned.length) * 100) : 0;
    });
    return levels;
  }

  // A day's energy (0–100): habits done and focus time
  function dayEnergy(date) {
    if (isFuture(date)) return null;
    const planned = state.habits.filter((h) => scheduled(h, date));
    const done = planned.filter((h) => isDone(h.id, date)).length;
    const habitsPart = planned.length ? done / planned.length : 0;
    return Math.round(habitsPart * 70 + Math.min(1, focusMinutes(date) / 150) * 30);
  }

  function rangeEnergy(from, to) {
    const days = pastDays(from, to);
    if (!days.length) return null;
    return Math.round(days.reduce((sum, d) => sum + dayEnergy(d), 0) / days.length);
  }

  function rangeFocus(from, to) {
    return pastDays(from, to).reduce((sum, d) => sum + focusMinutes(d), 0);
  }

  function rangeRituals(from, to) {
    return pastDays(from, to).reduce((sum, d) => sum + state.habits.filter((h) => isDone(h.id, d)).length, 0);
  }

  function rangeBreaks(from, to) {
    return pastDays(from, to).reduce((sum, d) => sum + breaks(d), 0);
  }

  // Days in a row with at least 3 habits done, counting back from `to`
  // (today counts only once it's reached that)
  function streak(to) {
    let n = 0;
    let d = startOfDay(to) > today() ? today() : startOfDay(to);
    const enough = (day) => state.habits.filter((h) => isDone(h.id, day)).length >= 3;
    if (isToday(d) && !enough(d)) d = addDays(d, -1);
    while (n < 999 && enough(d)) {
      n += 1;
      d = addDays(d, -1);
    }
    return n;
  }

  return {
    ELEMENTS,
    PRACTICES,
    DAY,
    today,
    addDays,
    key,
    fromKey,
    weekday,
    isFuture,
    isToday,
    seeded,
    habits,
    habit,
    isDone,
    toggleHabit,
    updateHabit,
    focusMinutes,
    addSession,
    entriesOn,
    moodOn,
    recentEntries,
    addEntry,
    tasks,
    toggleTask,
    addTask,
    updateTask,
    deleteTask,
    elementLevels,
    dayEnergy,
    rangeEnergy,
    rangeFocus,
    rangeRituals,
    rangeBreaks,
    streak,
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
})();
