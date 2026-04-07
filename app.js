// ============================================
//  GROVE — Daily Growth Tracker
//  Unified App Logic (Login + App in one page)
// ============================================

// ---- AUTH SYSTEM ----
const USERS_KEY = 'grove_users';
const CURRENT_USER_KEY = 'grove_current_user';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch(e) { return {}; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null; }
  catch(e) { return null; }
}
function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function showLoginPage() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('app-page').style.display = 'none';
  document.getElementById('bg-scene').style.display = 'block';
}

function showAppPage() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app-page').style.display = 'block';
  document.getElementById('bg-scene').style.display = 'none';
  updateUserHeader();
  render();
}

function updateUserHeader() {
  const user = getCurrentUser();
  if (!user) return;
  const initial = user.username.charAt(0).toUpperCase();
  document.getElementById('user-avatar').textContent = initial;
  document.getElementById('user-display-name').textContent = user.username;
}

// ---- TAB SWITCHING ----
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).style.display = 'block';
    // Clear errors on tab switch
    document.getElementById('login-error').textContent = '';
    document.getElementById('reg-error').textContent = '';
  });
});

// Enter key on login inputs
document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});
document.getElementById('login-username').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});
document.getElementById('reg-confirm').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-register').click();
});

// ---- LOGIN ----
document.getElementById('btn-login').addEventListener('click', () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password.';
    return;
  }

  const users = getUsers();
  if (!users[username] || users[username].password !== password) {
    errorEl.textContent = 'Invalid username or password.';
    return;
  }

  errorEl.textContent = '';
  setCurrentUser({ username });
  loadUserData(username);
  showAppPage();
  showToast('Welcome back, ' + username + '! 🌿');
});

// ---- REGISTER ----
document.getElementById('btn-register').addEventListener('click', () => {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const errorEl  = document.getElementById('reg-error');

  if (!username || !password || !confirm) {
    errorEl.textContent = 'Please fill in all fields.';
    return;
  }
  if (username.length < 3) {
    errorEl.textContent = 'Username must be at least 3 characters.';
    return;
  }
  if (password.length < 4) {
    errorEl.textContent = 'Password must be at least 4 characters.';
    return;
  }
  if (password !== confirm) {
    errorEl.textContent = 'Passwords do not match.';
    return;
  }

  const users = getUsers();
  if (users[username]) {
    errorEl.textContent = 'Username already taken. Try another.';
    return;
  }

  const defaultState = getDefaultState();
  users[username] = { password, state: defaultState };
  saveUsers(users);
  errorEl.textContent = '';
  setCurrentUser({ username });
  state = defaultState;
  state.lastCheckedDate = todayStr();
  saveState();
  showAppPage();
  showToast('Welcome to Grove, ' + username + '! 🌱 Plant your first seed.');
});

// ---- LOGOUT ----
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  state = null;
  showLoginPage();
});

// ---- STATE ----
const STATE_KEY = 'grove_state';
let state = null;

function getDefaultState() {
  return {
    tasks: [
      { id: 't1', label: 'Morning exercise 🏃', done: false },
      { id: 't2', label: 'Drink 8 glasses of water 💧', done: false },
      { id: 't3', label: 'Read for 20 minutes 📖', done: false },
      { id: 't4', label: 'Meditate or breathe deeply 🧘', done: false },
      { id: 't5', label: 'Healthy meal 🥗', done: false },
    ],
    completedDays: [],
    currentStreak: 0,
    totalXP: 0,
    vouchers: [],
    lastCheckedDate: null,
    fruitReady: false,
    fruitClaimed: false,
  };
}

function getUserStateKey(username) {
  return 'grove_state_' + username;
}

function saveState() {
  const user = getCurrentUser();
  if (user && state) {
    localStorage.setItem(getUserStateKey(user.username), JSON.stringify(state));
  }
}

function loadUserData(username) {
  try {
    const raw = localStorage.getItem(getUserStateKey(username));
    if (raw) {
      const s = JSON.parse(raw);
      const today = todayStr();
      if (s.lastCheckedDate !== today) {
        s.tasks = s.tasks.map(t => ({ ...t, done: false }));
        s.lastCheckedDate = today;
      }
      if (!s.totalXP) s.totalXP = 0;
      if (!s.vouchers) s.vouchers = [];
      state = s;
    } else {
      state = getDefaultState();
      state.lastCheckedDate = todayStr();
      saveState();
    }
  } catch(e) {
    state = getDefaultState();
    state.lastCheckedDate = todayStr();
    saveState();
  }
}

// ---- DATE HELPERS ----
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function todayAlreadyCompleted() {
  return state && state.completedDays.includes(todayStr());
}

// ---- TREE GROWTH LOGIC ----
function getTreeStage() {
  if (!state) return 0;
  const cycleDays = state.completedDays.length % 21;
  if (cycleDays === 0 && state.completedDays.length > 0) return 5;
  if (cycleDays >= 18) return 5;
  if (cycleDays >= 13) return 4;
  if (cycleDays >= 8)  return 3;
  if (cycleDays >= 4)  return 2;
  if (cycleDays >= 1)  return 1;
  return 0;
}
function getCycleWeek() {
  if (!state) return 1;
  const cycleDays = state.completedDays.length % 21 || (state.completedDays.length > 0 ? 21 : 0);
  if (cycleDays <= 7)  return 1;
  if (cycleDays <= 14) return 2;
  return 3;
}
function getCycleDay() {
  if (!state) return 0;
  return state.completedDays.length % 21 || (state.completedDays.length > 0 ? 21 : 0);
}

const TREE_STAGES = ['🌱 Seed', '🌿 Sprout', '🌱 Sapling', '🌲 Young Tree', '🌳 Mature Tree', '🍎 Full Bloom'];

// ---- SVG TREES ----
function getTreeSVG(stage) {
  const svgs = {
    0: `<svg class="tree-svg" width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="108" rx="38" ry="12" fill="#8d6e63" opacity="0.5"/>
      <ellipse cx="60" cy="94" rx="14" ry="10" fill="#795548"/>
      <ellipse cx="60" cy="91" rx="10" ry="7" fill="#a1887f"/>
      <line x1="60" y1="84" x2="58" y2="76" stroke="#4caf50" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="58" y1="76" x2="54" y2="70" stroke="#4caf50" stroke-width="2" stroke-linecap="round"/>
      <line x1="58" y1="76" x2="63" y2="70" stroke="#4caf50" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    1: `<svg class="tree-svg" width="160" height="180" viewBox="0 0 160 180" xmlns="http://www.w3.org/2000/svg">
      <rect x="72" y="130" width="16" height="45" rx="7" fill="#6d4c41"/>
      <rect x="74" y="130" width="6" height="45" rx="4" fill="#8d6e63" opacity="0.4"/>
      <ellipse cx="80" cy="105" rx="32" ry="28" fill="#2d6a4f"/>
      <ellipse cx="60" cy="115" rx="22" ry="18" fill="#40916c"/>
      <ellipse cx="100" cy="112" rx="22" ry="18" fill="#40916c"/>
      <ellipse cx="80" cy="88" rx="24" ry="22" fill="#52b788"/>
      <ellipse cx="70" cy="96" rx="10" ry="7" fill="#74c69d" opacity="0.4"/>
    </svg>`,

    2: `<svg class="tree-svg" width="200" height="240" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
      <path d="M88,175 Q82,210 80,235 Q85,230 92,235 Q90,210 112,175 Z" fill="#5d4037"/>
      <path d="M88,175 Q86,200 85,235 Q87,232 90,235 Q88,205 100,175 Z" fill="#8d6e63" opacity="0.3"/>
      <path d="M90,165 Q72,150 60,142" stroke="#6d4c41" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M110,170 Q126,152 138,145" stroke="#6d4c41" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="100" cy="130" rx="55" ry="45" fill="#2d6a4f"/>
      <ellipse cx="70" cy="148" rx="38" ry="30" fill="#40916c"/>
      <ellipse cx="130" cy="145" rx="38" ry="30" fill="#40916c"/>
      <ellipse cx="100" cy="100" rx="48" ry="40" fill="#52b788"/>
      <ellipse cx="80" cy="115" rx="30" ry="25" fill="#74c69d" opacity="0.6"/>
      <ellipse cx="120" cy="112" rx="28" ry="22" fill="#74c69d" opacity="0.5"/>
      <ellipse cx="100" cy="82" rx="32" ry="28" fill="#95d5b2"/>
      <ellipse cx="86" cy="92" rx="14" ry="9" fill="white" opacity="0.15"/>
    </svg>`,

    3: `<svg class="tree-svg" width="240" height="290" viewBox="0 0 240 290" xmlns="http://www.w3.org/2000/svg">
      <path d="M106,200 Q98,240 96,288 Q103,283 114,288 Q112,240 134,200 Z" fill="#5d4037"/>
      <path d="M108,200 Q104,235 102,288 Q105,284 108,288 Q106,240 120,200 Z" fill="#8d6e63" opacity="0.3"/>
      <path d="M108,188 Q88,168 70,155" stroke="#6d4c41" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M132,192 Q152,170 170,158" stroke="#6d4c41" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M118,175 Q120,148 118,130" stroke="#6d4c41" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="120" cy="155" rx="72" ry="60" fill="#1b4332"/>
      <ellipse cx="82" cy="168" rx="48" ry="38" fill="#2d6a4f"/>
      <ellipse cx="158" cy="165" rx="48" ry="38" fill="#2d6a4f"/>
      <ellipse cx="120" cy="115" rx="60" ry="50" fill="#40916c"/>
      <ellipse cx="88" cy="130" rx="42" ry="35" fill="#52b788"/>
      <ellipse cx="152" cy="128" rx="40" ry="34" fill="#52b788"/>
      <ellipse cx="120" cy="90" rx="46" ry="40" fill="#74c69d"/>
      <ellipse cx="100" cy="104" rx="28" ry="22" fill="#95d5b2" opacity="0.7"/>
      <ellipse cx="104" cy="96" rx="18" ry="12" fill="white" opacity="0.12"/>
    </svg>`,

    4: `<svg class="tree-svg" width="280" height="340" viewBox="0 0 280 340" xmlns="http://www.w3.org/2000/svg">
      <path d="M122,220 Q112,270 110,338 Q120,332 132,338 Q130,268 158,220 Z" fill="#4e342e"/>
      <path d="M124,220 Q118,260 116,338 Q120,334 124,338 Q122,262 138,220 Z" fill="#8d6e63" opacity="0.25"/>
      <path d="M110,330 Q95,335 80,338" stroke="#4e342e" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M132,336 Q148,338 162,336" stroke="#4e342e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M122,210 Q96,185 74,168" stroke="#5d4037" stroke-width="13" fill="none" stroke-linecap="round"/>
      <path d="M148,214 Q172,188 195,172" stroke="#5d4037" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M134,196 Q134,162 132,140" stroke="#5d4037" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M100,194 Q78,178 60,172" stroke="#6d4c41" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M160,200 Q180,182 198,178" stroke="#6d4c41" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="140" cy="175" rx="90" ry="75" fill="#1b4332"/>
      <ellipse cx="96" cy="192" rx="60" ry="48" fill="#2d6a4f"/>
      <ellipse cx="184" cy="188" rx="60" ry="48" fill="#2d6a4f"/>
      <ellipse cx="140" cy="130" rx="76" ry="62" fill="#40916c"/>
      <ellipse cx="104" cy="148" rx="52" ry="44" fill="#52b788"/>
      <ellipse cx="176" cy="144" rx="52" ry="44" fill="#52b788"/>
      <ellipse cx="140" cy="100" rx="62" ry="52" fill="#74c69d"/>
      <ellipse cx="110" cy="116" rx="38" ry="30" fill="#95d5b2" opacity="0.6"/>
      <ellipse cx="168" cy="112" rx="36" ry="28" fill="#95d5b2" opacity="0.55"/>
      <ellipse cx="140" cy="76" rx="42" ry="36" fill="#b7e4c7"/>
      <ellipse cx="122" cy="86" rx="22" ry="14" fill="white" opacity="0.13"/>
    </svg>`,

    5: `<svg class="tree-svg" id="full-tree-svg" width="320" height="370" viewBox="0 0 320 370" xmlns="http://www.w3.org/2000/svg">
      <path d="M140,240 Q128,285 124,368 Q136,362 148,368 Q146,282 176,240 Z" fill="#3e2723"/>
      <path d="M142,240 Q136,275 132,368 Q138,362 144,368 Q142,276 158,240 Z" fill="#8d6e63" opacity="0.2"/>
      <line x1="136" y1="250" x2="130" y2="310" stroke="#2a1a10" stroke-width="2" opacity="0.3" stroke-linecap="round"/>
      <line x1="148" y1="248" x2="155" y2="305" stroke="#2a1a10" stroke-width="2" opacity="0.3" stroke-linecap="round"/>
      <path d="M124,356 Q104,362 85,368" stroke="#3e2723" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M148,366 Q165,368 182,364" stroke="#3e2723" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M130,362 Q118,368 105,372" stroke="#4e342e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M140,228 Q110,200 82,178" stroke="#4e342e" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M164,232 Q192,202 220,180" stroke="#4e342e" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path d="M152,216 Q152,178 150,152" stroke="#4e342e" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M112,210 Q86,196 62,192" stroke="#5d4037" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M180,216 Q206,200 228,196" stroke="#5d4037" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M86,186 Q68,174 52,170" stroke="#6d4c41" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M218,188 Q236,176 252,172" stroke="#6d4c41" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="152" cy="370" rx="80" ry="14" fill="rgba(0,0,0,0.15)"/>
      <ellipse cx="160" cy="190" rx="110" ry="92" fill="#1b4332"/>
      <ellipse cx="108" cy="210" rx="72" ry="58" fill="#2d6a4f"/>
      <ellipse cx="212" cy="206" rx="72" ry="58" fill="#2d6a4f"/>
      <ellipse cx="160" cy="148" rx="90" ry="75" fill="#40916c"/>
      <ellipse cx="118" cy="168" rx="62" ry="52" fill="#52b788"/>
      <ellipse cx="202" cy="162" rx="62" ry="52" fill="#52b788"/>
      <ellipse cx="160" cy="116" rx="74" ry="62" fill="#74c69d"/>
      <ellipse cx="126" cy="134" rx="46" ry="38" fill="#95d5b2" opacity="0.65"/>
      <ellipse cx="194" cy="128" rx="44" ry="36" fill="#95d5b2" opacity="0.6"/>
      <ellipse cx="160" cy="88" rx="54" ry="46" fill="#b7e4c7"/>
      <ellipse cx="138" cy="96" rx="26" ry="18" fill="white" opacity="0.18"/>
      <g id="fruits-group"></g>
    </svg>`,
  };
  return svgs[stage] || svgs[0];
}

function getFruitsSVG() {
  return `
    <g class="fruit-item" style="animation-delay:0s">
      <circle cx="82" cy="148" r="14" fill="#e63946" stroke="#c1121f" stroke-width="1.5"/>
      <circle cx="80" cy="145" r="5" fill="rgba(255,255,255,0.3)"/>
      <path d="M82 134 Q86 126 90 130" stroke="#2d6a4f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="90" cy="127" rx="7" ry="4" fill="#52b788" transform="rotate(-20,90,127)"/>
    </g>
    <g class="fruit-item" style="animation-delay:-0.7s">
      <circle cx="232" cy="155" r="13" fill="#e63946" stroke="#c1121f" stroke-width="1.5"/>
      <circle cx="230" cy="152" r="4.5" fill="rgba(255,255,255,0.3)"/>
      <path d="M232 141 Q236 133 240 137" stroke="#2d6a4f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="240" cy="134" rx="7" ry="4" fill="#52b788" transform="rotate(-15,240,134)"/>
    </g>
    <g class="fruit-item" style="animation-delay:-1.3s">
      <circle cx="152" cy="78" r="12" fill="#f4a261" stroke="#e76f51" stroke-width="1.5"/>
      <circle cx="150" cy="75" r="4" fill="rgba(255,255,255,0.3)"/>
      <path d="M152 66 Q156 58 160 62" stroke="#2d6a4f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="160" cy="59" rx="6" ry="3.5" fill="#52b788" transform="rotate(-20,160,59)"/>
    </g>`;
}

// ---- VOUCHER REWARDS ----
const VOUCHER_REWARDS = [
  { emoji: '☕', title: 'Free Coffee Day', desc: 'Treat yourself to a nice cup — you earned it!' },
  { emoji: '🛁', title: 'Spa Evening', desc: 'Relax with a full self-care evening ritual.' },
  { emoji: '🎬', title: 'Movie Night', desc: 'Pick any film and enjoy a guilt-free movie night.' },
  { emoji: '🍕', title: 'Favourite Meal', desc: 'Order or cook your absolute favourite meal.' },
  { emoji: '📚', title: 'Bookstore Trip', desc: 'Browse and pick up a book that calls to you.' },
  { emoji: '🎮', title: 'Gaming Session', desc: 'Two uninterrupted hours of your favourite game.' },
  { emoji: '🌿', title: 'Nature Walk', desc: 'A peaceful solo walk in nature — just you and the trees.' },
];

function generateVoucherCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GROVE-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---- RENDER ----
function render() {
  if (!state) return;
  renderHeader();
  renderTasks();
  renderTree();
  renderWeekCalendar();
  renderMonthGrid();
  renderWeekStreak();
  renderMilestoneTrack();
  renderVouchers();
  renderXP();
  checkFruitReady();
}

function renderHeader() {
  const d = new Date();
  document.getElementById('current-date-display').textContent =
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('streak-count').textContent = state.currentStreak;
  document.getElementById('stat-streak').textContent = state.currentStreak;
  document.getElementById('stat-weeks').textContent = Math.floor(state.completedDays.length / 7);
  document.getElementById('stat-xp').textContent = state.totalXP || 0;
}

function renderXP() {
  const xp = state.totalXP || 0;
  const levelXP = 100;
  const pct = Math.min((xp % levelXP) / levelXP * 100, 100);
  document.getElementById('xp-bar-fill').style.width = pct + '%';
  document.getElementById('xp-label-text').textContent = xp + ' XP';
}

function renderTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  const alreadyDone = todayAlreadyCompleted();

  state.tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = 'task-item' + (task.done ? ' done' : '');
    div.innerHTML = `
      <div class="task-checkbox">${task.done ? '✓' : ''}</div>
      <span class="task-label">${escapeHtml(task.label)}</span>
      ${!alreadyDone ? `<button class="task-delete" data-id="${task.id}" title="Remove">✕</button>` : ''}
    `;
    if (!alreadyDone) {
      div.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(task.id));
      div.querySelector('.task-label').addEventListener('click', () => toggleTask(task.id));
      const del = div.querySelector('.task-delete');
      if (del) del.addEventListener('click', e => { e.stopPropagation(); deleteTask(task.id); });
    }
    list.appendChild(div);
  });

  const done  = state.tasks.filter(t => t.done).length;
  const total = state.tasks.length;
  const pct   = total ? (done / total) * 100 : 0;

  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-fraction').textContent = `${done}/${total}`;

  const btn = document.getElementById('day-complete-btn');
  const dayDone = todayAlreadyCompleted();
  btn.disabled = pct < 100 || dayDone;
  btn.textContent = dayDone ? '✅ Day Completed!' : '✅ Mark Day Complete';
}

function renderTree() {
  const stage = getTreeStage();
  document.getElementById('tree-container').innerHTML = getTreeSVG(stage);

  if (state.fruitReady && !state.fruitClaimed && stage === 5) {
    const fg = document.getElementById('fruits-group');
    if (fg) fg.innerHTML = getFruitsSVG();
  }

  document.getElementById('tree-level-badge').textContent = TREE_STAGES[stage];
  document.getElementById('week-number').textContent = getCycleWeek();

  const dotsContainer = document.getElementById('week-dots');
  dotsContainer.innerHTML = '';
  const cycleDays = getCycleDay();
  for (let w = 1; w <= 3; w++) {
    const dot = document.createElement('div');
    dot.className = 'week-dot';
    if (cycleDays >= w * 7) dot.classList.add('done');
    else if (cycleDays >= (w - 1) * 7 + 1) dot.classList.add('partial');
    dotsContainer.appendChild(dot);
  }
}

function renderWeekCalendar() {
  const cal = document.getElementById('week-calendar');
  cal.innerHTML = '';
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const isToday = ds === todayStr();
    const isDone  = state.completedDays.includes(ds);
    const isPast  = d < today && !isToday;

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (isDone) cell.classList.add('complete');
    else if (isPast) cell.classList.add('missed');
    if (isToday) cell.classList.add('today');

    cell.innerHTML = `
      <span class="day-name">${d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
      <span class="day-num">${isDone ? '✓' : d.getDate()}</span>
    `;
    cal.appendChild(cell);
  }
}

function renderMonthGrid() {
  const grid = document.getElementById('month-grid');
  grid.innerHTML = '';
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const todayDate = today.getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d  = new Date(today.getFullYear(), today.getMonth(), day);
    const ds = d.toISOString().split('T')[0];
    const cell = document.createElement('div');
    cell.className = 'month-cell';
    if (state.completedDays.includes(ds)) cell.classList.add('done');
    if (day === todayDate) cell.classList.add('today-cell');
    cell.textContent = day;
    grid.appendChild(cell);
  }
}

function renderWeekStreak() {
  const container = document.getElementById('week-streak');
  if (!container) return;
  container.innerHTML = '';
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d  = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const isDone = state.completedDays.includes(ds);
    const isToday = ds === todayStr();
    const dot = document.createElement('div');
    dot.className = 'streak-dot' + (isDone ? ' done' : '') + (isToday ? ' today' : '');
    dot.title = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    container.appendChild(dot);
  }
}

function renderMilestoneTrack() {
  const track = document.getElementById('month-track');
  if (!track) return;
  track.innerHTML = '';
  const totalCycles = Math.floor(state.completedDays.length / 21);
  const cycleDays   = getCycleDay();
  // Show up to 4 milestones
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div');
    el.className = 'milestone-node';
    if (i < totalCycles) {
      el.classList.add('done');
      el.title = 'Cycle ' + (i+1) + ' complete!';
      el.innerHTML = '🍎';
    } else if (i === totalCycles) {
      el.classList.add('active');
      el.title = 'In progress: ' + cycleDays + '/21 days';
      el.innerHTML = '🌱';
    } else {
      el.innerHTML = '○';
    }
    track.appendChild(el);
  }
}

function renderVouchers() {
  const list = document.getElementById('voucher-list');
  list.innerHTML = '';
  if (!state.vouchers || state.vouchers.length === 0) {
    list.innerHTML = '<p class="empty-voucher">Complete 3 weeks to earn your first voucher!</p>';
    return;
  }
  state.vouchers.forEach(v => {
    const div = document.createElement('div');
    div.className = 'voucher-item';
    div.innerHTML = `
      <span class="v-icon">${v.emoji}</span>
      <div class="v-info">
        <div class="v-title">${v.title}</div>
        <div class="v-code">${v.code}</div>
      </div>
      <span class="v-status">CLAIMED</span>
    `;
    list.appendChild(div);
  });
}

// ---- INTERACTIONS ----
function toggleTask(id) {
  if (todayAlreadyCompleted() || !state) return;
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveState();
    renderTasks();
  }
}

function addTask() {
  if (!state) return;
  const input = document.getElementById('new-task-input');
  const val = input.value.trim();
  if (!val) return;
  state.tasks.push({ id: 't' + Date.now(), label: val, done: false });
  input.value = '';
  saveState();
  renderTasks();
}

function deleteTask(id) {
  if (todayAlreadyCompleted() || !state) return;
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderTasks();
}

// Add task button & enter key
document.getElementById('add-task-btn').addEventListener('click', addTask);
document.getElementById('new-task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

// Day complete button
document.getElementById('day-complete-btn').addEventListener('click', completeDayAction);

function completeDayAction() {
  if (!state) return;
  const today = todayStr();
  if (todayAlreadyCompleted()) return;
  const allDone = state.tasks.every(t => t.done);
  if (!allDone) return;

  state.completedDays.push(today);

  // Streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const ys = yesterday.toISOString().split('T')[0];
  state.currentStreak = state.completedDays.includes(ys) ? state.currentStreak + 1 : 1;

  // XP
  state.totalXP = (state.totalXP || 0) + 10 + (state.currentStreak >= 7 ? 5 : 0);

  // 3-week cycle check (21 days)
  if (state.completedDays.length % 21 === 0) {
    state.fruitReady = true;
    state.fruitClaimed = false;
  }

  saveState();
  render();
  launchConfetti();
  showToast('Day complete! 🌿 +10 XP');

  if (state.fruitReady && !state.fruitClaimed) {
    setTimeout(() => {
      document.getElementById('fruit-popup').style.display = 'flex';
    }, 1800);
  }
}

function checkFruitReady() {
  const popup = document.getElementById('fruit-popup');
  if (!state || !state.fruitReady || state.fruitClaimed) {
    popup.style.display = 'none';
  }
}

// Claim voucher from fruit popup
document.getElementById('btn-claim-voucher').addEventListener('click', claimVoucher);

function claimVoucher() {
  document.getElementById('fruit-popup').style.display = 'none';

  const reward = VOUCHER_REWARDS[Math.floor(Math.random() * VOUCHER_REWARDS.length)];
  const code   = generateVoucherCode();

  state.vouchers = state.vouchers || [];
  state.vouchers.push({ ...reward, code, date: todayStr() });
  state.fruitReady  = false;
  state.fruitClaimed = true;

  saveState();
  renderVouchers();

  document.getElementById('generated-code').textContent = code;
  document.getElementById('voucher-reward-text').textContent = `${reward.emoji} ${reward.title} — ${reward.desc}`;
  document.getElementById('voucher-modal').style.display = 'flex';

  launchConfetti();
}

document.getElementById('btn-close-modal').addEventListener('click', () => {
  document.getElementById('voucher-modal').style.display = 'none';
  render();
});

// ---- TOAST ----
function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ---- CONFETTI ----
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#40916c','#74c69d','#b7e4c7','#f4a261','#e63946','#ffd700','#a8dadc'];
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    w: 8 + Math.random() * 8,
    h: 4 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 4,
    vy: 3 + Math.random() * 4,
    rot: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 8,
    alpha: 1,
  }));

  let frame;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    pieces.forEach(p => {
      if (p.alpha <= 0) return;
      alive = true;
      p.x += p.vx; p.y += p.vy; p.rot += p.rotSpeed;
      if (p.y > canvas.height * 0.85) p.alpha -= 0.03;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (alive) frame = requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  if (frame) cancelAnimationFrame(frame);
  animate();
}

// ---- UTILS ----
function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

// ---- DEBUG: Shift+F to simulate 21 days ----
document.addEventListener('keydown', e => {
  if (e.shiftKey && e.key === 'F' && state) {
    const base = new Date();
    for (let i = 20; i >= 0; i--) {
      const d  = new Date(base);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (!state.completedDays.includes(ds)) state.completedDays.push(ds);
    }
    state.currentStreak  = 21;
    state.fruitReady     = true;
    state.fruitClaimed   = false;
    state.totalXP        = (state.totalXP || 0) + 210;
    saveState();
    render();
    setTimeout(() => {
      document.getElementById('fruit-popup').style.display = 'flex';
    }, 500);
  }
});

// ---- INIT ----
(function init() {
  const user = getCurrentUser();
  if (user) {
    loadUserData(user.username);
    showAppPage();
  } else {
    showLoginPage();
  }
})();
