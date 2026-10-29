const app = document.querySelector('#app');
let queue = [], position = 0, failAt = null, selected = '';
const shuffle = items => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
};
const LEVELS = [
  { id: 'easy', label: 'Лёгкие', caption: 'Разминка для своих' },
  { id: 'medium', label: 'Средние', caption: 'Копаем глубже' },
  { id: 'hard', label: 'Сложные', caption: 'Вспомнить всё' }
];
let previousSelection = '';
try { previousSelection = sessionStorage.getItem('birthday-last-selection') || ''; } catch {}
function selectionKey(items) { return items.map(q => q.id).sort().join(','); }
function buildQuiz() {
  const counts = { easy: 3, medium: 4, hard: 3 };
  const bonus = QUESTIONS.find(q => q.id === 'q26');
  const result = LEVELS.flatMap(level => shuffle(QUESTIONS.filter(q => q.enabled !== false && q.id !== bonus.id && q.difficulty === level.id)).slice(0, counts[level.id]));
  // Guarantee a different set from the previous attempt, including after a reload when storage is available.
  if (selectionKey([...result, bonus]) === previousSelection) {
    const replacement = shuffle(QUESTIONS.filter(q => q.difficulty === 'easy' && q.enabled !== false && !result.includes(q)))[0];
    if (replacement) result[0] = replacement;
  }
  result.push({ ...bonus, difficulty: 'bonus' });
  previousSelection = selectionKey(result);
  try { sessionStorage.setItem('birthday-last-selection', previousSelection); } catch {}
  return result;
}
function isCorrect(q, value) {
  return (q.answers || [q.answer]).some(answer => normalize(value, q.type) === normalize(answer, q.type));
}
function normalize(value, type) {
  let result = value.trim().toUpperCase().replace(/\s/g, '');
  if (type === 'plate') { const letters = { A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', Y: 'У', X: 'Х' }; result = result.replace(/[ABEKMHOPCTYX]/g, ch => letters[ch]); }
  if (type === 'date') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(result)) result = result.split('-').reverse().join('');
    else result = result.replace(/[./\-]/g, '');
  }
  return result;
}
function focusTitle() { const title = app.querySelector('h1'); title.tabIndex = -1; title.focus({ preventScroll: true }); window.scrollTo(0, 0); }
function giftArt() { return '<div class="gift-stage" aria-hidden="true"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="spark s1">✳</span><span class="spark s2">✦</span><span class="spark s3">+</span><div class="gift"><div class="bow left"></div><div class="bow right"></div><div class="gift-box"></div><div class="gift-lid"></div><div class="ribbon"></div><div class="gift-tag">ТЕБЕ.<br>ОТ СВОИХ.</div></div><span class="art-caption">СОДЕРЖИМОЕ ПОКА ЗАСЕКРЕЧЕНО</span></div>'; }
function welcome() {
  app.innerHTML = `<section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="dot"></span> ПРОВЕРКА НА ПОДЛИННОСТЬ АЛЕКСАШКИ</p><h1>Докажи, что ты <em>закрученный.</em></h1><p class="intro">Но на всякий случай не перекручивай.<br>Вспомни всё, что было. Забери то, что будет.</p><button class="primary" id="start">Открыть испытание <span>↗</span></button><div class="facts"><span>11 вопросов</span><span>Без таймера</span><span>Один подарок</span></div></div>${giftArt()}</section><section class="rules"><span class="rules-number">01 / ПРАВИЛА КЛУБА</span><p>Вспоминай. Выбирай. Не косячь.<small>Три этапа: лёгкие, средние и сложные. И бонус на десерт. В каждой попытке — новый набор. Для победы нужны все правильные ответы.</small></p><span class="rules-star" aria-hidden="true">✳</span></section>`;
  document.querySelector('#start').onclick = start;
}
function start() { queue = buildQuiz(); position = 0; failAt = null; question(); }
function question() {
  selected = ''; const q = queue[position];
  const levelIndex = q.difficulty === 'bonus' ? LEVELS.length : LEVELS.findIndex(level => level.id === q.difficulty);
  const level = LEVELS[levelIndex] || { caption: 'Бонус · последний штрих' };
  app.innerHTML = `<section class="quiz"><div class="quiz-meta"><span class="eyebrow">ПРОВЕРКА НА СВОЕГО</span><span>${String(position + 1).padStart(2, '0')} <span class="muted">/ ${queue.length}</span></span></div><div class="progress" role="progressbar" aria-label="Пройдено вопросов" aria-valuemin="0" aria-valuemax="${queue.length}" aria-valuenow="${position}"><span style="width:${position / queue.length * 100}%"></span></div><ol class="difficulty-steps" aria-label="Этапы теста">${LEVELS.map((item, i) => `<li class="${i === levelIndex ? 'active' : i < levelIndex ? 'completed' : ''}" ${i === levelIndex ? 'aria-current="step"' : ''}><span>${String(i + 1).padStart(2, '0')}</span> ${item.label}</li>`).join('')}</ol><p class="question-label">${level.caption.toUpperCase()} · ${position + 1 - queue.findIndex(item => item.difficulty === q.difficulty)} ИЗ ${queue.filter(item => item.difficulty === q.difficulty).length} В ЭТАПЕ</p><h1>${q.title}</h1><form id="answer-form">${q.options ? `<div class="options" role="group" aria-label="Варианты ответа">${q.options.map((option, i) => `<button class="option" type="button" data-index="${i}" aria-pressed="false"><span class="option-letter">${'АБВГ'[i]}</span><span>${option}</span><span class="option-check" aria-hidden="true">🍆</span></button>`).join('')}</div>` : `<label class="input-label" for="answer">${q.type === 'plate' ? 'Госномер с регионом' : q.type === 'date' ? 'Выбери дату' : 'Вес в граммах'}</label><input id="answer" autocomplete="off" spellcheck="false" maxlength="30" ${q.type === 'date' ? 'type="date" min="1900-01-01" max="2100-12-31"' : q.type === 'weight' ? 'inputmode="numeric"' : ''} placeholder="${q.placeholder || 'ДД.ММ.ГГГГ'}" required><p class="input-hint">${q.type === 'plate' ? 'Можно русскими или английскими буквами, с пробелами или без.' : 'Вспоминай не спеша. Время на твоей стороне.'}</p>`}<div class="quiz-bottom"><span>Только ты и твоя память.</span><button class="primary" id="next" disabled>Ответ принят? <span>→</span></button></div></form></section>`;
  const next = document.querySelector('#next');
  document.querySelectorAll('.option').forEach(button => button.onclick = () => { selected = q.options[Number(button.dataset.index)]; document.querySelectorAll('.option').forEach(item => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); }); next.disabled = false; next.innerHTML = 'Зафиксировать <span>→</span>'; });
  const input = document.querySelector('#answer');
  if (input) input.oninput = input.onchange = () => { selected = input.value; next.disabled = !selected.trim() || !input.validity.valid; next.innerHTML = 'Зафиксировать <span>→</span>'; };
  let submitting = false;
  document.querySelector('#answer-form').onsubmit = event => {
    event.preventDefault();
    if (!selected.trim() || submitting) return;
    submitting = true;
    const answer = selected;
    next.disabled = true;
    document.querySelectorAll('.option').forEach(button => { button.disabled = true; });
    if (input) input.disabled = true;
    answerSplash(() => {
      if (!isCorrect(q, answer) && failAt === null) failAt = position + 1 + (1 + Math.floor(Math.random() * 2));
      position++;
      if (failAt !== null && (position >= failAt || position >= queue.length)) finish(false);
      else if (position >= queue.length) victoryReveal();
      else question();
    });
  };
  focusTitle();
}
function answerSplash(done) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return; }
  const source = document.querySelector('.option.selected .option-check') || document.querySelector('#next');
  const rect = source.getBoundingClientRect();
  const x = Math.max(24, Math.min(innerWidth - 24, rect.left + rect.width / 2));
  const y = Math.max(24, Math.min(innerHeight - 24, rect.top + rect.height / 2));
  const layer = document.createElement('div');
  layer.className = 'answer-splash'; layer.setAttribute('aria-hidden', 'true');
  const eggplant = document.createElement('span');
  eggplant.className = 'splash-eggplant'; eggplant.textContent = '🍆';
  eggplant.style.cssText = `left:${x}px;top:${y}px`;
  layer.append(eggplant);
  // Spread destinations across the whole viewport, including its far corners.
  for (let i = 0; i < 64; i++) {
    const drop = document.createElement('i');
    const endX = ((i % 8) + Math.random()) / 8 * innerWidth;
    const endY = (Math.floor(i / 8) + Math.random()) / 8 * innerHeight;
    const dx = endX - x, dy = endY - y;
    const size = 10 + Math.random() * 23;
    drop.className = 'splash-drop';
    drop.style.cssText = `left:${x}px;top:${y}px;--dx:${dx}px;--dy:${dy}px;--angle:${Math.atan2(dy, dx) * 180 / Math.PI + 45}deg;--size:${size}px;--delay:${Math.random() * 100}ms;--duration:${650 + Math.random() * 250}ms`;
    layer.append(drop);
  }
  document.body.append(layer);
  setTimeout(() => { layer.remove(); done(); }, 1050);
}
function finish(success) {
  app.innerHTML = success ? `<section class="result success"><p class="eyebrow">ПРОВЕРКА ПРОЙДЕНА · ТЫ СВОЙ</p><div class="result-symbol" aria-hidden="true">✳</div><h1>Поздравляю!</h1><p class="result-intro">Воспоминания на месте.</p><div class="ticket"><span class="ticket-label">ТВОЙ ПОДАРОК ЖДЕТ ТЕБЯ</span><h2>Адрес:<br>Нижний Новгород,<br>улица Белинского, 124</h2><span class="ticket-note">Приехать надо на своем белом коне, в костюме петуха. Подойти на ресепшн и крикнуть: «Закрученный на месте». Важно: Приехать в течение ноября, в рабочее время.</span><span class="ticket-star" aria-hidden="true">↗</span></div><p class="signature">От души. От своих. ♥</p></section>` : `<section class="result failure"><p class="eyebrow">ПРОВЕРКА ЗАВЕРШЕНА</p><div class="result-symbol" aria-hidden="true">↺</div><h1>Где-то память<br><em>подвела.</em></h1><p class="result-intro">В этой истории что-то не сходится.<br>Какой именно ответ? Это останется между нами.</p><button class="primary" id="retry">Вспомнить ещё раз <span>↗</span></button><p class="retry-note">Новая попытка. Другой порядок. Тот же секрет.</p></section>`;
  if (success) celebrate(); else document.querySelector('#retry').onclick = start;
  focusTitle();
}
function celebrate() { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; const container = document.querySelector('#confetti'); for (let i = 0; i < 65; i++) { const bit = document.createElement('i'); bit.style.cssText = `left:${Math.random() * 100}%;background:${['#b98aff','#d9c1ff','#9263da','#fff'][i % 4]};animation-delay:${Math.random() * 1.5}s;animation-duration:${3 + Math.random() * 2}s;`; container.append(bit); } setTimeout(() => container.replaceChildren(), 7000); }
let sceneTimer;
function victoryReveal() {
  clearTimeout(sceneTimer);
  app.innerHTML = `<section class="reveal" aria-label="Поздравление"><p class="eyebrow">ЛИЧНОСТЬ ПОДТВЕРЖДЕНА</p><div class="reveal-motion"><h1>Ты доказал, что ты настоящий Алексашка</h1><p>и твой подарок…</p><div class="prank" aria-label="НИХУЯ">${[...'НИХУЯ'].map((letter, i) => `<span aria-hidden="true" style="--delay:${3 + i * 1.15}s">${letter}</span>`).join('')}</div></div><p class="reveal-note">Секунду. Это ещё не всё.</p></section>`;
  focusTitle(); celebrate();
  sceneTimer = setTimeout(() => finish(true), 10000);
}
function intro() {
  document.body.classList.add('intro-playing');
  const overlay = document.createElement('div');
  overlay.className = 'intro-overlay'; overlay.setAttribute('role', 'status');
  overlay.innerHTML = `<div class="monkey-sticker" aria-hidden="true"><svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg"><ellipse cx="160" cy="294" rx="95" ry="12" fill="#000" opacity=".2"/><path d="M107 237Q54 266 62 220Q66 198 82 214" fill="none" stroke="#8c573b" stroke-width="17" stroke-linecap="round"/><ellipse cx="160" cy="225" rx="65" ry="65" fill="#8c573b" stroke="#f5e9ff" stroke-width="6"/><ellipse cx="160" cy="232" rx="40" ry="47" fill="#dfac78"/><circle cx="95" cy="116" r="29" fill="#8c573b" stroke="#f5e9ff" stroke-width="6"/><circle cx="225" cy="116" r="29" fill="#8c573b" stroke="#f5e9ff" stroke-width="6"/><circle cx="95" cy="116" r="16" fill="#dfac78"/><circle cx="225" cy="116" r="16" fill="#dfac78"/><path d="M96 119Q90 52 152 49Q156 31 172 35L169 49Q231 51 225 119Q224 180 160 184Q96 179 96 119" fill="#8c573b" stroke="#f5e9ff" stroke-width="6"/><path d="M115 97Q133 77 160 103Q187 77 205 97Q225 155 160 170Q95 155 115 97" fill="#efc79a"/><ellipse cx="137" cy="117" rx="7" ry="10" fill="#251b2a"/><ellipse cx="183" cy="117" rx="7" ry="10" fill="#251b2a"/><path d="M142 145Q160 161 178 145" fill="none" stroke="#251b2a" stroke-width="5" stroke-linecap="round"/><ellipse cx="160" cy="135" rx="9" ry="6" fill="#8c573b"/><g class="monkey-arm arm-left"><path d="M112 204L76 192" stroke="#8c573b" stroke-width="24" stroke-linecap="round"/><ellipse cx="83" cy="207" rx="15" ry="49" fill="#cba8ff" stroke="#f5e9ff" stroke-width="5"/><ellipse cx="83" cy="207" rx="7" ry="24" fill="#9363cb"/><circle cx="91" cy="205" r="13" fill="#efc79a"/></g><g class="monkey-arm arm-right"><path d="M208 204L244 192" stroke="#8c573b" stroke-width="24" stroke-linecap="round"/><ellipse cx="237" cy="207" rx="15" ry="49" fill="#cba8ff" stroke="#f5e9ff" stroke-width="5"/><ellipse cx="237" cy="207" rx="7" ry="24" fill="#9363cb"/><circle cx="229" cy="205" r="13" fill="#efc79a"/></g><g class="clang" fill="#d7b7ff"><path d="M153 191L160 174L167 191L160 185Z"/><path d="M149 212L135 220L142 206Z"/><path d="M171 212L185 220L178 206Z"/></g></svg></div><p>Алексашка, приготовься.</p><span>Сейчас проверим закрученность</span>`;
  document.body.append(overlay);
  setTimeout(() => { overlay.remove(); document.body.classList.remove('intro-playing'); welcome(); }, 3600);
}
intro();
