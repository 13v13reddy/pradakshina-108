export const GOAL = 108;
export const HOLD_MS = 850;
export const GUARD_MS = 12_000;
export const STORAGE_KEY = 'pradakshina.practice.v1';
export const PREFERENCES_KEY = 'pradakshina.preferences.v1';

export function newPractice(now = Date.now()) {
  return { version: 1, id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(36).slice(2)}`, createdAt: now, updatedAt: now, paused: false, entries: [] };
}

export function validatePractice(value) {
  const isTimestamp = number => Number.isSafeInteger(number) && number >= 0 && number <= 8_640_000_000_000_000;
  if (!value || value.version !== 1 || typeof value.id !== 'string' || !isTimestamp(value.createdAt) || !isTimestamp(value.updatedAt) || typeof value.paused !== 'boolean' || !Array.isArray(value.entries) || value.entries.length > GOAL) return false;
  let previous = 0;
  const ids = new Set();
  return value.entries.every(entry => {
    if (!entry || typeof entry.id !== 'string' || ids.has(entry.id) || !isTimestamp(entry.at) || entry.at < previous) return false;
    previous = entry.at;
    ids.add(entry.id);
    return true;
  });
}

export function parsePractice(raw) {
  if (raw === null) return null;
  const value = JSON.parse(raw);
  if (!validatePractice(value)) throw new Error('Saved practice is not valid.');
  return value;
}

export function guardRemaining(practice, now = Date.now()) {
  const last = practice.entries.at(-1);
  if (!last) return 0;
  return Math.max(0, GUARD_MS - Math.max(0, now - last.at));
}

export function recordRound(practice, now = Date.now()) {
  if (practice.paused) return { practice, reason: 'paused' };
  if (practice.entries.length >= GOAL) return { practice, reason: 'complete' };
  if (guardRemaining(practice, now) > 0) return { practice, reason: 'guard' };
  const at = Math.max(now, practice.entries.at(-1)?.at ?? 0);
  const entry = { id: globalThis.crypto?.randomUUID?.() ?? `${at}-${practice.entries.length + 1}`, at };
  return { practice: { ...practice, updatedAt: now, entries: [...practice.entries, entry] }, reason: 'saved' };
}

export function undoRound(practice, expectedEntryId, now = Date.now()) {
  if (!expectedEntryId || practice.entries.at(-1)?.id !== expectedEntryId) return { practice, reason: 'changed' };
  return { practice: { ...practice, updatedAt: now, entries: practice.entries.slice(0, -1) }, reason: 'undone' };
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
