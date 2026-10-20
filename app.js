import { GOAL, MAX_GOAL, HOLD_MS, STORAGE_KEY, PREFERENCES_KEY, newPractice, parsePractice, startPractice, changeGoal, elapsedMs, durationText, guardRemaining, recordRound, undoRound, savePractice, ageText } from './state.js?v=3';

const $ = id => document.getElementById(id);
const ui = Object.fromEntries(['count', 'count-label', 'goal-label', 'walking-label', 'receipt', 'receipt-title', 'receipt-detail', 'receipt-icon', 'receipt-age', 'record-button', 'record-title', 'record-subtitle', 'record-end', 'hold-fill', 'hold-help', 'practice-live', 'pause-button', 'pause-label', 'undo-button', 'error-banner', 'save-status', 'status-dot'].map(id => [id, $(id)]));
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const clockFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
let practice;
let blocked = false;
let busy = false;
let hold = null;
let holdFrame = 0;
let preferences = { tap: false, wake: false };
let wakeLock = null;
let offlineReady = false;
let installPrompt = null;
let pendingConfirmation = null;
let focusBeforeDialog = null;
let renderedCount = -1;
let renderedGoal = -1;
let beads = [];

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function drawBeads(goal) {
  const total = Math.min(goal, GOAL);
  beads = Array.from({ length: total }, (_, i) => {
    const angle = ((i + .5) / total) * Math.PI * 2 - Math.PI / 2;
    const bead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bead.setAttribute('cx', (180 + Math.cos(angle) * 160).toFixed(3));
    bead.setAttribute('cy', (180 + Math.sin(angle) * 160).toFixed(3));
    bead.setAttribute('r', i % 9 === 8 ? '3' : '2.3');
    bead.classList.add('bead');
    return bead;
  });
  $('beads').replaceChildren(...beads);
}

function announce(message) { ui['practice-live'].textContent = message; }
function error(message) {
  ui['error-banner'].textContent = message;
  ui['error-banner'].hidden = !message;
  ui['status-dot'].classList.toggle('error', Boolean(message));
  updateSaveStatus();
}
function updateSaveStatus() {
  ui['save-status'].textContent = blocked || !ui['error-banner'].hidden ? 'Check saving before continuing' : offlineReady ? 'Saved here · ready offline' : 'Saved on this device';
}

function savePreferences() {
  try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); }
  catch { /* Counting still works if a nonessential preference cannot be saved. */ }
  $('tap-switch').setAttribute('aria-checked', String(preferences.tap));
  $('wake-switch').setAttribute('aria-checked', String(preferences.wake));
}

function render() {
  if (!practice) return;
  const count = practice.entries.length;
  const complete = count === practice.goal;
  if (renderedGoal !== practice.goal) {
    drawBeads(practice.goal);
    renderedGoal = practice.goal;
    renderedCount = -1;
  }
  if (renderedCount !== count) {
    ui.count.textContent = String(count);
    ui.count.setAttribute('aria-label', `${count} of ${practice.goal} rounds completed`);
    const completedBeads = Math.floor(count / practice.goal * beads.length);
    beads.forEach((bead, i) => {
      bead.classList.toggle('completed', i < completedBeads);
      bead.classList.toggle('current', i === completedBeads && !complete);
    });
    renderedCount = count;
    renderHistory();
  }
  ui['count-label'].textContent = complete ? 'YOUR PRACTICE IS COMPLETE' : 'ROUNDS COMPLETED';
  ui['goal-label'].textContent = `of ${practice.goal} ${practice.goal === 1 ? 'pradakshina' : 'pradakshinas'}`;
  $('goal-button').setAttribute('aria-label', `Change your round goal, currently ${practice.goal}`);
  $('settings-goal').textContent = `${practice.goal} ${practice.goal === 1 ? 'round' : 'rounds'}`;
  ui['walking-label'].textContent = complete ? 'A full circle. Take a moment.' : practice.startedAt === null ? 'Your practice, your pace.' : practice.paused ? 'Rest a moment. Your place is safe.' : `You’re on round ${count + 1}`;
  ui['receipt'].classList.toggle('is-saved', count > 0);
  const last = practice.entries.at(-1);
  if (last) {
    ui['receipt-title'].textContent = `Round ${count} is saved.`;
    ui['receipt-detail'].textContent = `${dateFormat.format(last.at)} · ${timeFormat.format(last.at)}`;
    ui['receipt-icon'].replaceChildren(icon('check'));
  } else {
    ui['receipt-title'].textContent = 'Your first round is ahead.';
    ui['receipt-detail'].textContent = 'We’ll remember each one you finish.';
    const orbit = document.createElement('span');
    orbit.className = 'small-orbit';
    ui['receipt-icon'].replaceChildren(orbit);
  }
  ui['pause-button'].hidden = complete || practice.startedAt === null;
  ui['pause-button'].disabled = blocked || busy;
  document.querySelector('.practice-actions').hidden = practice.startedAt === null;
  document.querySelector('.action-divider').hidden = complete;
  ui['record-end'].replaceChildren(icon(practice.startedAt === null ? 'play' : 'check'));
  ui['pause-label'].textContent = practice.paused ? 'Resume' : 'Pause';
  $('pause-icon').replaceChildren();
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', practice.paused ? '#i-play' : '#i-pause');
  $('pause-icon').append(use);
  ui['undo-button'].disabled = count === 0 || blocked || busy;
  renderTime();
}

function renderTime() {
  if (!practice) return;
  const last = practice.entries.at(-1);
  const remaining = guardRemaining(practice);
  const complete = practice.entries.length === practice.goal;
  renderTiming();
  ui['receipt-age'].textContent = last ? ageText(last.at) : '';
  if (hold) return;
  let mode = 'ready';
  let title = preferences.tap ? 'Tap to record this round' : 'Hold to complete a round';
  let subtitle = preferences.tap ? 'One touch, one completed round' : 'A steady touch. We’ll take it from here.';
  let help = 'At the same spot, after every round.';
  if (blocked) {
    mode = 'blocked'; title = 'Your saved practice needs attention'; subtitle = 'Open settings to recover or start fresh'; help = 'Your existing data has been left untouched.';
  } else if (complete) {
    mode = 'complete'; title = `${practice.goal}. Every round, remembered.`; subtitle = 'Your practice is complete'; help = 'Your rounds and finish time are saved.';
  } else if (practice.startedAt === null) {
    mode = 'start'; title = 'Start practice'; subtitle = `${practice.goal} ${practice.goal === 1 ? 'round' : 'rounds'} · tap when you begin`; help = 'Set your goal above, then start at your chosen spot.';
  } else if (practice.paused) {
    mode = 'paused'; title = 'A moment to pause'; subtitle = 'Tap Resume when you’re ready'; help = 'Your place is saved, for as long as you need.';
  } else if (remaining > 0) {
    mode = 'guard'; title = `Round ${practice.entries.length} recorded`; subtitle = `Ready for the next in ${Math.ceil(remaining / 1000)}s`; help = 'Already saved. A second touch won’t count twice.';
  }
  ui['record-button'].dataset.mode = mode;
  ui['record-button'].disabled = !['ready', 'start'].includes(mode) || busy;
  ui['record-title'].textContent = title;
  ui['record-subtitle'].textContent = subtitle;
  ui['hold-help'].textContent = help;
}

function renderTiming() {
  const setTime = (id, timestamp, fallback) => {
    const element = $(id);
    element.textContent = timestamp === null ? fallback : clockFormat.format(timestamp);
    if (timestamp === null) { element.removeAttribute('datetime'); element.removeAttribute('title'); }
    else { element.dateTime = new Date(timestamp).toISOString(); element.title = new Date(timestamp).toLocaleString(); }
  };
  $('start-time-label').textContent = practice.startEstimated ? 'Opened' : 'Started';
  setTime('start-time', practice.startedAt, '—');
  if (practice.startEstimated) $('start-time').title = 'Estimated start from when this earlier practice was opened.';
  setTime('finish-time', practice.finishedAt, practice.startedAt === null ? '—' : 'In progress');
  $('duration-label').textContent = practice.finishedAt === null ? 'Elapsed' : 'Total time';
  $('duration').textContent = durationText(elapsedMs(practice));
  $('duration').title = 'Wall-clock time, including breaks';
}

function renderHistory() {
  if (!practice) return;
  const count = practice.entries.length;
  $('history-description').textContent = count ? `${count} of ${practice.goal} rounds, safely remembered.` : 'Every round, remembered.';
  $('empty-goal').textContent = String(practice.goal);
  $('history-empty').hidden = count > 0;
  $('history-footer').hidden = count === 0;
  const rows = practice.entries.map((entry, i) => {
    const row = document.createElement('li');
    row.className = 'history-row';
    const dot = document.createElement('span'); dot.className = 'history-dot'; dot.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.className = 'history-round'; label.textContent = `Round ${i + 1}`;
    const time = document.createElement('time'); time.className = 'history-time'; time.dateTime = new Date(entry.at).toISOString(); time.textContent = timeFormat.format(entry.at);
    const date = document.createElement('span'); date.className = 'history-date'; date.textContent = dateFormat.format(entry.at); time.append(date);
    row.append(dot, label, time);
    return row;
  }).reverse();
  $('history-list').replaceChildren(...rows);
}

async function mutate(transform) {
  if (busy || blocked) return false;
  busy = true;
  cancelHold();
  const run = () => {
    // Read immediately before the write so a second tab cannot overwrite an old count.
    const latest = parsePractice(localStorage.getItem(STORAGE_KEY)) ?? practice;
    const result = transform(latest);
    if (!result || result.practice === latest) {
      practice = latest; render();
      return result?.reason ?? false;
    }
    savePractice(localStorage, result.practice);
    practice = result.practice;
    error('');
    render();
    return result.reason;
  };
  try {
    return navigator.locks?.request ? await navigator.locks.request(STORAGE_KEY, run) : run();
  } catch {
    error('This change was not saved. Your browser couldn’t store it. Keep this page open and try again after freeing device storage.');
    announce('The round was not recorded. The browser could not save it.');
    return false;
  } finally {
    busy = false;
    render();
  }
}

async function completeRound() {
  if (!practice || blocked || busy) return;
  const result = await mutate(latest => recordRound(latest));
  if (result !== 'saved') return;
  const count = practice.entries.length;
  const bead = beads[Math.min(beads.length - 1, Math.floor((count - 1) / practice.goal * beads.length))];
  bead.classList.remove('just-saved');
  void bead.getBoundingClientRect();
  bead.classList.add('just-saved');
  ui.receipt.classList.remove('is-fresh');
  void ui.receipt.getBoundingClientRect();
  ui.receipt.classList.add('is-fresh');
  // Safari does not offer vibration. The persistent visual receipt is primary.
  try { navigator.vibrate?.(count === practice.goal ? [30, 70, 30] : 30); } catch { /* Optional feedback. */ }
  announce(count === practice.goal ? `${practice.goal} rounds completed. Finish time saved. Total time ${durationText(elapsedMs(practice))}.` : `Round ${count} saved at ${timeFormat.format(practice.entries.at(-1).at)}. You are on round ${count + 1}.`);
  if (count === practice.goal) releaseWakeLock();
}

async function beginPractice() {
  const result = await mutate(latest => startPractice(latest));
  if (result === 'started') {
    announce(`Practice started at ${timeFormat.format(practice.startedAt)}. Your goal is ${practice.goal} rounds.`);
    if (preferences.wake) requestWakeLock();
  }
}

function startHold(source, pointerId = null) {
  if (ui['record-button'].disabled || practice.startedAt === null || preferences.tap || hold) return;
  hold = { start: performance.now(), source, pointerId };
  ui['record-button'].classList.add('is-holding');
  ui['record-title'].textContent = 'Stay for a moment…';
  ui['record-subtitle'].textContent = 'Release early to cancel';
  const tick = now => {
    if (!hold) return;
    const progress = Math.min(1, (now - hold.start) / HOLD_MS);
    ui['hold-fill'].style.transform = `scaleX(${progress})`;
    if (progress >= 1) {
      cancelHold();
      completeRound();
    } else holdFrame = requestAnimationFrame(tick);
  };
  holdFrame = requestAnimationFrame(tick);
}

function cancelHold() {
  cancelAnimationFrame(holdFrame);
  hold = null;
  ui['hold-fill'].style.transform = 'scaleX(0)';
  ui['record-button'].classList.remove('is-holding');
  renderTime();
}

ui['record-button'].addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || practice.startedAt === null || preferences.tap || ui['record-button'].disabled) return;
  event.preventDefault();
  ui['record-button'].setPointerCapture(event.pointerId);
  startHold('pointer', event.pointerId);
});
ui['record-button'].addEventListener('pointermove', event => {
  if (!hold || hold.source !== 'pointer') return;
  const box = ui['record-button'].getBoundingClientRect();
  if (event.clientX < box.left - 12 || event.clientX > box.right + 12 || event.clientY < box.top - 12 || event.clientY > box.bottom + 12) cancelHold();
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  ui['record-button'].addEventListener(eventName, () => { if (hold?.source === 'pointer') cancelHold(); });
}
ui['record-button'].addEventListener('contextmenu', event => event.preventDefault());
ui['record-button'].addEventListener('keydown', event => {
  if (![' ', 'Enter'].includes(event.key) || practice.startedAt === null || preferences.tap) return;
  event.preventDefault();
  if (!event.repeat) startHold('keyboard');
});
ui['record-button'].addEventListener('keyup', event => {
  if (![' ', 'Enter'].includes(event.key) || practice.startedAt === null || preferences.tap) return;
  event.preventDefault();
  if (hold?.source === 'keyboard') cancelHold();
});
ui['record-button'].addEventListener('click', event => {
  if (ui['record-button'].disabled) return;
  if (practice.startedAt === null) { beginPractice(); return; }
  // detail 0 is keyboard/assistive activation; pointer clicks require a hold unless tap mode is selected.
  if (preferences.tap || (event.detail === 0 && !hold)) completeRound();
});
ui['record-button'].addEventListener('blur', () => { if (hold?.source === 'keyboard') cancelHold(); });
window.addEventListener('blur', cancelHold);
document.addEventListener('visibilitychange', () => {
  cancelHold();
  if (document.visibilityState === 'visible') {
    syncFromStorage();
    if (preferences.wake) requestWakeLock();
  } else releaseWakeLock();
});

function openSheet(id) {
  cancelHold();
  if (!document.activeElement?.closest('dialog')) focusBeforeDialog = document.activeElement;
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
  if (id === 'history-dialog') renderHistory();
  $(id).showModal();
}
for (const sheet of document.querySelectorAll('dialog')) {
  sheet.addEventListener('click', event => {
    if (event.target !== sheet) return;
    const rect = sheet.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) sheet.close();
  });
  sheet.addEventListener('close', () => {
    if (sheet.id === 'confirm-dialog') pendingConfirmation = null;
    if (!document.querySelector('dialog[open]')) focusBeforeDialog?.focus?.();
  });
  sheet.querySelector('.sheet-close')?.addEventListener('click', () => sheet.close());
}
$('history-button').addEventListener('click', () => openSheet('history-dialog'));
$('settings-button').addEventListener('click', () => openSheet('settings-dialog'));
for (const id of ['install-button', 'settings-install']) $(id).addEventListener('click', () => openSheet('install-dialog'));

function openGoal() {
  $('goal-input').value = String(practice.goal);
  $('goal-error').hidden = true;
  $('goal-input').removeAttribute('aria-invalid');
  refreshPresets();
  openSheet('goal-dialog');
}
function refreshPresets() {
  for (const button of document.querySelectorAll('[data-goal]')) button.setAttribute('aria-pressed', String(Number(button.dataset.goal) === Number($('goal-input').value)));
}
for (const id of ['goal-button', 'settings-goal']) $(id).addEventListener('click', openGoal);
for (const button of document.querySelectorAll('[data-goal]')) button.addEventListener('click', () => { $('goal-input').value = button.dataset.goal; refreshPresets(); });
$('goal-input').addEventListener('input', refreshPresets);
$('goal-form').addEventListener('submit', async event => {
  event.preventDefault();
  const goal = Number($('goal-input').value);
  if (!Number.isInteger(goal) || goal < 1 || goal > MAX_GOAL) {
    $('goal-error').textContent = 'Choose a whole number from 1 to 9,999.';
    $('goal-error').hidden = false; $('goal-input').setAttribute('aria-invalid', 'true'); $('goal-input').focus(); return;
  }
  $('save-goal').disabled = true;
  const result = await mutate(latest => changeGoal(latest, goal));
  $('save-goal').disabled = false;
  if (result === 'below-count') {
    $('goal-error').textContent = `You’ve saved ${practice.entries.length} rounds. Choose that count or higher to keep them.`;
    $('goal-error').hidden = false; $('goal-input').setAttribute('aria-invalid', 'true'); $('goal-input').focus();
  } else if (result === 'goal-changed' || result === 'unchanged') {
    $('goal-dialog').close(); announce(`Your goal is ${practice.goal} rounds. Your saved rounds are kept.`);
    if (practice.finishedAt !== null) releaseWakeLock();
    else if (preferences.wake) requestWakeLock();
  } else if (!result) {
    $('goal-error').textContent = 'Your goal was not saved. Close this sheet to check the saving message.';
    $('goal-error').hidden = false;
  }
});

function confirmAction({ title, description, action, cancel = 'Keep it', callback }) {
  $('confirm-title').textContent = title;
  $('confirm-description').textContent = description;
  $('confirm-action').textContent = action;
  $('confirm-cancel').textContent = cancel;
  openSheet('confirm-dialog');
  pendingConfirmation = callback;
}
$('confirm-cancel').addEventListener('click', () => $('confirm-dialog').close());
$('confirm-action').addEventListener('click', async () => {
  const callback = pendingConfirmation;
  $('confirm-dialog').close();
  pendingConfirmation = null;
  await callback?.();
});

ui['pause-button'].addEventListener('click', async () => {
  const result = await mutate(latest => ({ practice: { ...latest, paused: !latest.paused, updatedAt: Date.now() }, reason: latest.paused ? 'resumed' : 'paused' }));
  if (result === 'paused') releaseWakeLock();
  else if (result === 'resumed' && preferences.wake) requestWakeLock();
  if (result) announce(result === 'paused' ? 'Practice paused. Your place is saved.' : 'Practice resumed.');
});
ui['undo-button'].addEventListener('click', () => {
  const entry = practice.entries.at(-1);
  if (!entry) return;
  const number = practice.entries.length;
  confirmAction({ title: `Undo round ${number}?`, description: `Remove the round saved at ${timeFormat.format(entry.at)}? You’ll return to ${number - 1} completed ${number - 1 === 1 ? 'round' : 'rounds'}.`, action: 'Undo round', callback: async () => {
    const result = await mutate(latest => undoRound(latest, entry.id));
    if (result === 'undone') announce(`Round ${number} removed. ${practice.entries.length} rounds completed.`);
    else if (result === 'changed') error('Your practice changed in another tab. Check Your rounds before undoing.');
  } });
});
$('reset-button').addEventListener('click', () => {
  const expectedId = practice.id;
  const expectedUpdatedAt = practice.updatedAt;
  confirmAction({ title: 'Begin a new circle?', description: `This clears your current ${practice.entries.length} completed rounds on this device. Download your rounds first if you’d like to keep them.`, action: 'Begin again', cancel: 'Keep my place', callback: async () => {
    if (blocked) {
      try {
        // Preserve unreadable data for recovery, rather than silently destroying it.
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) localStorage.setItem(`${STORAGE_KEY}.recovery`, raw);
        const fresh = newPractice(Date.now(), practice.goal); savePractice(localStorage, fresh);
        practice = fresh; blocked = false; error(''); render();
      } catch { error('A new practice couldn’t be saved. Free some device storage, then try again.'); }
      return;
    }
    const result = await mutate(latest => latest.id !== expectedId || latest.updatedAt !== expectedUpdatedAt ? { practice: latest, reason: 'changed' } : { practice: newPractice(Date.now(), latest.goal), reason: 'reset' });
    if (result === 'changed') error('Your practice changed in another tab. Check Your rounds before starting again.');
    else if (result === 'reset') announce(`A new practice is ready. Your goal is ${practice.goal} rounds. Tap Start practice when you begin.`);
  } });
});

$('tap-switch').addEventListener('click', () => {
  cancelHold(); preferences.tap = !preferences.tap; savePreferences(); render();
});

async function requestWakeLock() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible' || practice.startedAt === null || practice.paused || practice.finishedAt !== null) return;
  try {
    if (wakeLock && !wakeLock.released) return;
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { $('wake-description').textContent = preferences.wake ? 'Paused by your phone. Keep this app visible.' : 'While your practice is open.'; });
    $('wake-description').textContent = 'Screen stays on while this app is visible.';
  } catch { $('wake-description').textContent = 'Your phone declined. Check battery saver or Auto-Lock.'; }
}
async function releaseWakeLock() {
  try { await wakeLock?.release(); } catch { /* Already released by the browser. */ }
  wakeLock = null;
}
$('wake-switch').addEventListener('click', () => {
  preferences.wake = !preferences.wake; savePreferences();
  if (preferences.wake) requestWakeLock(); else { releaseWakeLock(); $('wake-description').textContent = 'While your practice is open.'; }
});
if (!('wakeLock' in navigator)) {
  $('wake-switch').disabled = true;
  $('wake-description').textContent = 'Your browser doesn’t support this. Use your phone’s Auto-Lock setting.';
}

$('export-button').addEventListener('click', () => {
  const data = { app: 'Pradakshina', goal: practice.goal, startedAt: practice.startedAt === null ? null : new Date(practice.startedAt).toISOString(), startEstimated: practice.startEstimated, finishedAt: practice.finishedAt === null ? null : new Date(practice.finishedAt).toISOString(), durationMs: elapsedMs(practice), exportedAt: new Date().toISOString(), completed: practice.entries.length, rounds: practice.entries.map((entry, i) => ({ round: i + 1, savedAt: new Date(entry.at).toISOString() })) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `pradakshina-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
});

function syncFromStorage() {
  if (busy) return;
  try {
    const saved = parsePractice(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      practice = saved; blocked = false; renderedCount = -1; render();
    } else if (practice) {
      // Another tab cleared storage; never restore a stale count over its fresh state.
      practice = newPractice(); savePractice(localStorage, practice); renderedCount = -1; render();
    }
  } catch {
    blocked = true;
    error('Your saved rounds couldn’t be read. Keep this page open. You can start fresh in Settings; the unreadable data will be kept as a recovery copy.');
    render();
  }
}
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY || event.key === null) { cancelHold(); syncFromStorage(); }
});

window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('native-install').hidden = false; });
$('native-install').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt(); installPrompt = null; $('native-install').hidden = true;
});
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
$('ios-install').hidden = !isIOS && /Android/.test(navigator.userAgent);
$('other-install').hidden = isIOS || !/Android/.test(navigator.userAgent);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (standalone) {
  $('install-button').hidden = true;
  $('settings-install').hidden = true;
}

try {
  const saved = parsePractice(localStorage.getItem(STORAGE_KEY));
  practice = saved ?? newPractice();
  if (!saved) savePractice(localStorage, practice);
} catch {
  practice ??= newPractice();
  blocked = true;
  error('Your saved rounds couldn’t be opened or saved. Keep this page open. In Settings, you can begin again; existing data will be kept as a recovery copy.');
}
try {
  const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY));
  if (saved && typeof saved.tap === 'boolean' && typeof saved.wake === 'boolean') preferences = { tap: saved.tap, wake: saved.wake };
} catch { /* Preferences are optional; the practice record is handled separately. */ }
savePreferences();
render();
if (preferences.wake) requestWakeLock();
setInterval(renderTime, 1000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(async () => {
    await navigator.serviceWorker.ready;
    offlineReady = true;
    updateSaveStatus();
    $('offline-description').textContent = 'Ready for the temple. The app and fonts are saved for offline use on this device.';
  }).catch(() => {
    $('offline-description').textContent = 'Offline download hasn’t finished. Stay online and reopen the app once before leaving.';
  });
}
