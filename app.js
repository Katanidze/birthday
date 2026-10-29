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
  const counts = { easy: 3, medium: 4, hard: 3 + Math.floor(Math.random() * 2) };
  const result = LEVELS.flatMap(level => shuffle(QUESTIONS.filter(q => q.enabled !== false && q.difficulty === level.id)).slice(0, counts[level.id]));
  // Guarantee a different set from the previous attempt, including after a reload when storage is available.
  if (selectionKey(result) === previousSelection) {
    const replacement = shuffle(QUESTIONS.filter(q => q.difficulty === 'easy' && q.enabled !== false && !result.includes(q)))[0];
    if (replacement) result[0] = replacement;
  }
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
  if (type === 'date') result = result.replace(/[./\-]/g, '');
  return result;
}
function focusTitle() { const title = app.querySelector('h1'); title.tabIndex = -1; title.focus({ preventScroll: true }); window.scrollTo(0, 0); }
function giftArt() { return '<div class="gift-stage" aria-hidden="true"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="spark s1">✳</span><span class="spark s2">✦</span><span class="spark s3">+</span><div class="gift"><div class="bow left"></div><div class="bow right"></div><div class="gift-box"></div><div class="gift-lid"></div><div class="ribbon"></div><div class="gift-tag">ТЕБЕ.<br>ОТ СВОИХ.</div></div><span class="art-caption">СОДЕРЖИМОЕ ПОКА ЗАСЕКРЕЧЕНО</span></div>'; }
function welcome() {
  app.innerHTML = `<section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="dot"></span> ОПЕРАЦИЯ «СЮРПРИЗ»</p><h1>Своих<br>узнаём <em>сразу.</em></h1><p class="intro">Но тебя на всякий случай проверим.<br>Вспомни всё, что было. Забери то, что будет.</p><button class="primary" id="start">Открыть испытание <span>↗</span></button><div class="facts"><span>10–11 вопросов</span><span>Без таймера</span><span>Один подарок</span></div></div>${giftArt()}</section><section class="rules"><span class="rules-number">01 / ПРАВИЛА КЛУБА</span><p>Вспоминай. Выбирай. Не косячь.<small>Три этапа: лёгкие, средние и сложные. В каждой попытке — новый набор. Для победы нужны все правильные ответы.</small></p><span class="rules-star" aria-hidden="true">✳</span></section>`;
  document.querySelector('#start').onclick = start;
}
function start() { queue = buildQuiz(); position = 0; failAt = null; question(); }
function question() {
  selected = ''; const q = queue[position];
  const levelIndex = LEVELS.findIndex(level => level.id === q.difficulty);
  const level = LEVELS[levelIndex];
  app.innerHTML = `<section class="quiz"><div class="quiz-meta"><span class="eyebrow">ПРОВЕРКА НА СВОЕГО</span><span>${String(position + 1).padStart(2, '0')} <span class="muted">/ ${queue.length}</span></span></div><div class="progress" role="progressbar" aria-label="Пройдено вопросов" aria-valuemin="0" aria-valuemax="${queue.length}" aria-valuenow="${position}"><span style="width:${position / queue.length * 100}%"></span></div><ol class="difficulty-steps" aria-label="Этапы теста">${LEVELS.map((item, i) => `<li class="${i === levelIndex ? 'active' : i < levelIndex ? 'completed' : ''}" ${i === levelIndex ? 'aria-current="step"' : ''}><span>${String(i + 1).padStart(2, '0')}</span> ${item.label}</li>`).join('')}</ol><p class="question-label">${level.caption.toUpperCase()} · ${position + 1 - queue.findIndex(item => item.difficulty === q.difficulty)} ИЗ ${queue.filter(item => item.difficulty === q.difficulty).length} В ЭТАПЕ</p><h1>${q.title}</h1><form id="answer-form">${q.options ? `<div class="options" role="group" aria-label="Варианты ответа">${q.options.map((option, i) => `<button class="option" type="button" data-index="${i}" aria-pressed="false"><span class="option-letter">${'АБВГ'[i]}</span><span>${option}</span><span class="option-check" aria-hidden="true">↗</span></button>`).join('')}</div>` : `<label class="input-label" for="answer">${q.type === 'plate' ? 'Госномер с регионом' : q.type === 'date' ? 'Дата в формате ДД.ММ.ГГГГ' : 'Вес в граммах'}</label><input id="answer" autocomplete="off" spellcheck="false" maxlength="30" ${q.type === 'weight' || q.type === 'date' ? 'inputmode="numeric"' : ''} placeholder="${q.placeholder || 'ДД.ММ.ГГГГ'}" required><p class="input-hint">${q.type === 'plate' ? 'Можно русскими или английскими буквами, с пробелами или без.' : 'Вспоминай не спеша. Время на твоей стороне.'}</p>`}<div class="quiz-bottom"><span>Только ты и твоя память.</span><button class="primary" id="next" disabled>Ответ принят? <span>→</span></button></div></form></section>`;
  const next = document.querySelector('#next');
  document.querySelectorAll('.option').forEach(button => button.onclick = () => { selected = q.options[Number(button.dataset.index)]; document.querySelectorAll('.option').forEach(item => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); }); next.disabled = false; next.innerHTML = 'Зафиксировать <span>→</span>'; });
  const input = document.querySelector('#answer');
  if (input) input.oninput = () => { selected = input.value; next.disabled = !selected.trim(); next.innerHTML = 'Зафиксировать <span>→</span>'; };
  document.querySelector('#answer-form').onsubmit = event => { event.preventDefault(); if (!selected.trim()) return; if (!isCorrect(q, selected) && failAt === null) failAt = position + 1 + (1 + Math.floor(Math.random() * 2)); position++; if (failAt !== null && (position >= failAt || position >= queue.length)) finish(false); else if (position >= queue.length) finish(true); else question(); };
  focusTitle();
}
function finish(success) {
  app.innerHTML = success ? `<section class="result success"><p class="eyebrow">ПРОВЕРКА ПРОЙДЕНА · ТЫ СВОЙ</p><div class="result-symbol" aria-hidden="true">✳</div><h1>Поздравляю!</h1><p class="result-intro">Воспоминания на месте.<br>Твой подарок — установка сигнализации на автомобиль.</p><div class="ticket"><span class="ticket-label">ТВОЙ ПОДАРОК ЖДЁТ</span><h2>Адрес установки:<br>Нижний Новгород</h2><span class="ticket-note">Детали — совсем скоро. Свои всё организуют.</span><span class="ticket-star" aria-hidden="true">↗</span></div><p class="signature">От души. От своих. ♥</p></section>` : `<section class="result failure"><p class="eyebrow">ПРОВЕРКА ЗАВЕРШЕНА</p><div class="result-symbol" aria-hidden="true">↺</div><h1>Где-то память<br><em>подвела.</em></h1><p class="result-intro">В этой истории что-то не сходится.<br>Какой именно ответ? Это останется между нами.</p><button class="primary" id="retry">Вспомнить ещё раз <span>↗</span></button><p class="retry-note">Новая попытка. Другой порядок. Тот же секрет.</p></section>`;
  if (success) celebrate(); else document.querySelector('#retry').onclick = start;
  focusTitle();
}
function celebrate() { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; const container = document.querySelector('#confetti'); for (let i = 0; i < 65; i++) { const bit = document.createElement('i'); bit.style.cssText = `left:${Math.random() * 100}%;background:${['#d8fa70','#b6a3ee','#ff956f','#fff'][i % 4]};animation-delay:${Math.random() * 1.5}s;animation-duration:${3 + Math.random() * 2}s;`; container.append(bit); } setTimeout(() => container.replaceChildren(), 7000); }
welcome();
