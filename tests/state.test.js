import test from 'node:test';
import assert from 'node:assert/strict';
import { GOAL, MAX_GOAL, GUARD_MS, STORAGE_KEY, newPractice, startPractice, changeGoal, elapsedMs, durationText, validatePractice, parsePractice, recordRound, undoRound, guardRemaining, savePractice, ageText } from '../state.js';

const running = (now = 0, goal = GOAL) => startPractice(newPractice(now, goal), now).practice;

test('one deliberate record leaves an immutable timestamped receipt', () => {
  const original = running(1000);
  const result = recordRound(original, 2000);
  assert.equal(result.reason, 'saved');
  assert.equal(result.practice.entries.length, 1);
  assert.equal(result.practice.entries[0].at, 2000);
  assert.equal(original.entries.length, 0);
  assert.ok(validatePractice(result.practice));
});

test('duplicates are rejected across a close and reopen, including the guard boundary', () => {
  const saved = recordRound(running(1000), 2000).practice;
  const reopened = parsePractice(JSON.stringify(saved));
  assert.equal(recordRound(reopened, 2001).reason, 'guard');
  assert.equal(recordRound(reopened, 2000 + GUARD_MS - 1).reason, 'guard');
  assert.equal(recordRound(reopened, 2000 + GUARD_MS).reason, 'saved');
  assert.equal(guardRemaining(reopened, 2001), GUARD_MS - 1);
});

test('a paused practice cannot accidentally record', () => {
  const paused = { ...running(), paused: true };
  assert.equal(recordRound(paused).reason, 'paused');
  assert.equal(paused.entries.length, 0);
});

test('all 108 rounds can be recorded and a 109th is refused', () => {
  let practice = running(0);
  for (let i = 0; i < GOAL; i++) {
    const result = recordRound(practice, 1000 + i * GUARD_MS);
    assert.equal(result.reason, 'saved');
    practice = result.practice;
  }
  assert.ok(validatePractice(practice));
  assert.equal(practice.entries.length, GOAL);
  assert.equal(recordRound(practice, 1000 + GOAL * GUARD_MS).reason, 'complete');
});

test('undo removes only the round the user approved', () => {
  const first = recordRound(running(0), 1000).practice;
  const expectedId = first.entries[0].id;
  const second = recordRound(first, 1000 + GUARD_MS).practice;
  assert.equal(undoRound(second, expectedId).reason, 'changed');
  const result = undoRound(second, second.entries[1].id);
  assert.equal(result.reason, 'undone');
  assert.deepEqual(result.practice.entries, first.entries);
  assert.equal(second.entries.length, 2);
});

test('undoing completion allows a corrected final round', () => {
  let practice = running(0);
  for (let i = 0; i < GOAL; i++) practice = recordRound(practice, 1000 + i * GUARD_MS).practice;
  practice = undoRound(practice, practice.entries.at(-1).id).practice;
  assert.equal(practice.entries.length, 107);
  assert.equal(recordRound(practice, 1000 + GOAL * GUARD_MS).reason, 'saved');
});

test('corrupt, out-of-order, duplicate, and excessive entries are never treated as an empty practice', () => {
  assert.equal(parsePractice(null), null);
  for (const raw of ['bad json', '{}', '{"version":2}', 'null']) assert.throws(() => parsePractice(raw));
  const practice = newPractice(0);
  assert.equal(validatePractice({ ...practice, entries: [{ id: 'a', at: 2 }, { id: 'b', at: 1 }] }), false);
  assert.equal(validatePractice({ ...practice, entries: [{ id: 'a', at: 1 }, { id: 'a', at: 2 }] }), false);
  assert.equal(validatePractice({ ...practice, entries: Array.from({ length: 109 }, (_, i) => ({ id: String(i), at: i })) }), false);
  assert.equal(validatePractice({ ...practice, paused: 'false' }), false);
  assert.equal(validatePractice({ ...practice, entries: [{ id: 'a', at: 9e15 }] }), false);
});

test('a verified storage write can restore both count and exact receipt', () => {
  const data = new Map();
  const storage = { setItem: (key, value) => data.set(key, value), getItem: key => data.get(key) ?? null };
  const practice = recordRound(running(0), 1234).practice;
  savePractice(storage, practice);
  assert.deepEqual(parsePractice(storage.getItem(STORAGE_KEY)), practice);
});

test('write failures and silent storage failures are surfaced', () => {
  const practice = newPractice();
  assert.throws(() => savePractice({ setItem() { throw new Error('Quota exceeded'); } }, practice));
  assert.throws(() => savePractice({ setItem() {}, getItem() { return null; } }, practice));
});

test('clock changes cannot create a duplicate or a negative receipt age', () => {
  const practice = recordRound(running(0), 100_000).practice;
  assert.equal(guardRemaining(practice, 90_000), GUARD_MS);
  assert.equal(recordRound(practice, 90_000).reason, 'guard');
  assert.equal(ageText(100_000, 90_000), 'just now');
});

test('receipt age remains understandable over seconds, minutes and days', () => {
  assert.equal(ageText(1000, 1001), 'just now');
  assert.equal(ageText(1000, 9000), '8s ago');
  assert.equal(ageText(1000, 121000), '2m ago');
  assert.equal(ageText(1000, 7201000), '2h ago');
  assert.equal(ageText(1000, 172801000), '2d ago');
});

test('the start time is explicit, saved once, and does not count a round', () => {
  const fresh = newPractice(1000, 21);
  assert.equal(fresh.startedAt, null);
  assert.equal(recordRound(fresh, 2000).reason, 'not-started');
  const started = startPractice(fresh, 5000).practice;
  assert.equal(started.startedAt, 5000);
  assert.equal(started.entries.length, 0);
  assert.equal(started.finishedAt, null);
  assert.equal(startPractice(started, 9000).reason, 'already-started');
  assert.equal(elapsedMs(started, 12_000), 7000);
  assert.deepEqual(parsePractice(JSON.stringify(started)), started);
});

test('a custom goal finishes at its final round and freezes elapsed time', () => {
  let practice = running(1000, 3);
  practice = recordRound(practice, 5000).practice;
  assert.equal(practice.finishedAt, null);
  practice = recordRound(practice, 5000 + GUARD_MS).practice;
  practice = recordRound(practice, 5000 + 2 * GUARD_MS).practice;
  assert.equal(practice.entries.length, 3);
  assert.equal(practice.finishedAt, 5000 + 2 * GUARD_MS);
  assert.equal(elapsedMs(practice, 900_000), 28_000);
  assert.equal(recordRound(practice, 999_000).reason, 'complete');
  assert.ok(validatePractice(practice));
  assert.deepEqual(parsePractice(JSON.stringify(practice)), practice);
});

test('a one-round goal and the maximum goal both validate and finish correctly', () => {
  const single = recordRound(running(1000, 1), 5000).practice;
  assert.equal(single.finishedAt, 5000);
  assert.ok(validatePractice(single));
  let many = running(0, MAX_GOAL);
  for (let i = 0; i < MAX_GOAL; i++) many = recordRound(many, 1000 + i * GUARD_MS).practice;
  assert.equal(many.entries.length, MAX_GOAL);
  assert.ok(validatePractice(many));
  assert.equal(many.finishedAt, many.entries.at(-1).at);
});

test('goal changes keep receipts and reject invalid targets or targets below completed count', () => {
  let practice = recordRound(running(0, 3), 1000).practice;
  practice = recordRound(practice, 1000 + GUARD_MS).practice;
  const receipts = practice.entries;
  for (const goal of [0, -1, 1.5, NaN, Infinity, MAX_GOAL + 1]) assert.equal(changeGoal(practice, goal).reason, 'invalid-goal');
  assert.equal(changeGoal(practice, 1).reason, 'below-count');
  const completed = changeGoal(practice, 2, 50_000).practice;
  assert.equal(completed.entries, receipts);
  assert.equal(completed.finishedAt, 1000 + GUARD_MS);
  const reopened = changeGoal(completed, 54).practice;
  assert.equal(reopened.finishedAt, null);
  assert.equal(reopened.entries, receipts);
  assert.equal(reopened.startedAt, practice.startedAt);
});

test('undo clears completion time while retaining the original start', () => {
  const finished = recordRound(running(1000, 1), 5000).practice;
  const undone = undoRound(finished, finished.entries[0].id).practice;
  assert.equal(undone.startedAt, 1000);
  assert.equal(undone.finishedAt, null);
  assert.equal(undone.entries.length, 0);
  assert.ok(validatePractice(undone));
});

test('existing v1 rounds migrate without losing any receipts or changing the storage key', () => {
  const legacy = { version: 1, id: 'earlier-session', createdAt: 1000, updatedAt: 20_000, paused: false, entries: [{ id: 'a', at: 10_000 }, { id: 'b', at: 20_000 }] };
  const migrated = parsePractice(JSON.stringify(legacy));
  assert.equal(migrated.version, 2);
  assert.equal(migrated.id, legacy.id);
  assert.deepEqual(migrated.entries, legacy.entries);
  assert.equal(migrated.goal, 108);
  assert.equal(migrated.startedAt, 1000);
  assert.equal(migrated.startEstimated, true);
  assert.equal(migrated.finishedAt, null);
  assert.ok(validatePractice(migrated));
  const empty = parsePractice(JSON.stringify({ ...legacy, entries: [], paused: true }));
  assert.equal(empty.startedAt, null);
  assert.equal(empty.startEstimated, false);
  assert.equal(empty.paused, false);
  const entries = Array.from({ length: 108 }, (_, i) => ({ id: String(i), at: 1000 + i * GUARD_MS }));
  const complete = parsePractice(JSON.stringify({ ...legacy, entries }));
  assert.equal(complete.finishedAt, entries.at(-1).at);
  assert.ok(validatePractice(complete));
});

test('invalid timing records are refused instead of resetting a saved practice', () => {
  const practice = running(1000, 3);
  assert.equal(validatePractice({ ...practice, startedAt: null, entries: [{ id: 'a', at: 5000 }] }), false);
  assert.equal(validatePractice({ ...practice, entries: [{ id: 'a', at: 500 }] }), false);
  assert.equal(validatePractice({ ...practice, finishedAt: 5000 }), false);
  assert.equal(validatePractice({ ...practice, goal: 0 }), false);
});

test('duration is stable across reloads, includes breaks, and displays hours clearly', () => {
  const practice = { ...running(1000), paused: true };
  assert.equal(elapsedMs(practice, 121_000), 120_000);
  assert.equal(elapsedMs(parsePractice(JSON.stringify(practice)), 181_000), 180_000);
  assert.equal(elapsedMs(practice, 0), 0);
  assert.equal(durationText(0), '0:00');
  assert.equal(durationText(125_000), '2:05');
  assert.equal(durationText(3_661_000), '1:01:01');
});
