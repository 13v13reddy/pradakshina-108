export const GOAL = 108;
export const MAX_GOAL = 9999;
export const HOLD_MS = 850;
export const GUARD_MS = 12_000;
export const STORAGE_KEY = 'pradakshina.practice.v1';
export const PREFERENCES_KEY = 'pradakshina.preferences.v1';

export function newPractice(now = Date.now(), goal = GOAL) {
  if (!Number.isInteger(goal) || goal < 1 || goal > MAX_GOAL) throw new RangeError('Choose between 1 and 9,999 rounds.');
  return { version: 2, id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(36).slice(2)}`, createdAt: now, updatedAt: now, goal, startedAt: null, finishedAt: null, startEstimated: false, paused: false, entries: [] };
}

export function validatePractice(value) {
  const isTimestamp = number => Number.isSafeInteger(number) && number >= 0 && number <= 8_640_000_000_000_000;
  if (!value || ![1, 2].includes(value.version) || typeof value.id !== 'string' || !isTimestamp(value.createdAt) || !isTimestamp(value.updatedAt) || typeof value.paused !== 'boolean' || !Array.isArray(value.entries)) return false;
  const goal = value.version === 1 ? GOAL : value.goal;
  if (!Number.isInteger(goal) || goal < 1 || goal > MAX_GOAL || value.entries.length > goal) return false;
  if (value.version === 2) {
    if (typeof value.startEstimated !== 'boolean' || (value.startedAt !== null && !isTimestamp(value.startedAt)) || (value.finishedAt !== null && !isTimestamp(value.finishedAt))) return false;
    if (value.startedAt === null && (value.entries.length > 0 || value.finishedAt !== null || value.paused)) return false;
    if ((value.entries.length === goal) !== (value.finishedAt !== null)) return false;
    if (value.finishedAt !== null && (value.finishedAt < value.startedAt || value.finishedAt !== value.entries.at(-1)?.at)) return false;
  }
  let previous = 0;
  const ids = new Set();
  return value.entries.every(entry => {
    if (!entry || typeof entry.id !== 'string' || ids.has(entry.id) || !isTimestamp(entry.at) || entry.at < previous || (value.version === 2 && entry.at < value.startedAt)) return false;
    previous = entry.at;
    ids.add(entry.id);
    return true;
  });
}

export function parsePractice(raw) {
  if (raw === null) return null;
  const value = JSON.parse(raw);
  if (!validatePractice(value)) throw new Error('Saved practice is not valid.');
  if (value.version === 1) {
    const started = value.entries.length > 0;
    return { ...value, version: 2, goal: GOAL, startedAt: started ? Math.min(value.createdAt, value.entries[0].at) : null, finishedAt: value.entries.length === GOAL ? value.entries.at(-1).at : null, startEstimated: started, paused: started && value.paused };
  }
  return value;
}

export function startPractice(practice, now = Date.now()) {
  if (practice.startedAt !== null) return { practice, reason: 'already-started' };
  return { practice: { ...practice, startedAt: Math.max(now, practice.createdAt), updatedAt: now, paused: false }, reason: 'started' };
}

export function changeGoal(practice, goal, now = Date.now()) {
  if (!Number.isInteger(goal) || goal < 1 || goal > MAX_GOAL) return { practice, reason: 'invalid-goal' };
  if (goal < practice.entries.length) return { practice, reason: 'below-count' };
  if (goal === practice.goal) return { practice, reason: 'unchanged' };
  return { practice: { ...practice, goal, finishedAt: practice.entries.length === goal ? practice.entries.at(-1).at : null, updatedAt: now }, reason: 'goal-changed' };
}

export function elapsedMs(practice, now = Date.now()) {
  if (practice.startedAt === null) return 0;
  return Math.max(0, (practice.finishedAt ?? now) - practice.startedAt);
}

export function durationText(milliseconds) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const seconds = String(total % 60).padStart(2, '0');
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}

export function guardRemaining(practice, now = Date.now()) {
  const last = practice.entries.at(-1);
  if (!last) return 0;
  return Math.max(0, GUARD_MS - Math.max(0, now - last.at));
}

export function recordRound(practice, now = Date.now()) {
  if (practice.startedAt === null) return { practice, reason: 'not-started' };
  if (practice.paused) return { practice, reason: 'paused' };
  if (practice.entries.length >= practice.goal) return { practice, reason: 'complete' };
  if (guardRemaining(practice, now) > 0) return { practice, reason: 'guard' };
  const at = Math.max(now, practice.entries.at(-1)?.at ?? 0, practice.startedAt);
  const entry = { id: globalThis.crypto?.randomUUID?.() ?? `${at}-${practice.entries.length + 1}`, at };
  const entries = [...practice.entries, entry];
  return { practice: { ...practice, updatedAt: now, entries, finishedAt: entries.length === practice.goal ? at : null }, reason: 'saved' };
}

export function undoRound(practice, expectedEntryId, now = Date.now()) {
  if (!expectedEntryId || practice.entries.at(-1)?.id !== expectedEntryId) return { practice, reason: 'changed' };
  return { practice: { ...practice, updatedAt: now, finishedAt: null, entries: practice.entries.slice(0, -1) }, reason: 'undone' };
}

export function savePractice(storage, practice) {
  if (!validatePractice(practice)) throw new Error('Cannot save an invalid practice.');
  const serialized = JSON.stringify(practice);
  storage.setItem(STORAGE_KEY, serialized);
  if (storage.getItem(STORAGE_KEY) !== serialized) throw new Error('The browser could not verify the saved round.');
}

export function ageText(at, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
