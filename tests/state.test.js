import test from 'node:test';
import assert from 'node:assert/strict';
import { GOAL, GUARD_MS, STORAGE_KEY, newPractice, validatePractice, parsePractice, recordRound, undoRound, guardRemaining, savePractice, ageText } from '../state.js';

test('one deliberate record leaves an immutable timestamped receipt', () => {
  const original = newPractice(1000);
  const result = recordRound(original, 2000);
  assert.equal(result.reason, 'saved');
  assert.equal(result.practice.entries.length, 1);
  assert.equal(result.practice.entries[0].at, 2000);
  assert.equal(original.entries.length, 0);
  assert.ok(validatePractice(result.practice));
});

test('duplicates are rejected across a close and reopen, including the guard boundary', () => {
  const saved = recordRound(newPractice(1000), 2000).practice;
  const reopened = parsePractice(JSON.stringify(saved));
  assert.equal(recordRound(reopened, 2001).reason, 'guard');
  assert.equal(recordRound(reopened, 2000 + GUARD_MS - 1).reason, 'guard');
  assert.equal(recordRound(reopened, 2000 + GUARD_MS).reason, 'saved');
  assert.equal(guardRemaining(reopened, 2001), GUARD_MS - 1);
});

test('a paused practice cannot accidentally record', () => {
  const paused = { ...newPractice(), paused: true };
  assert.equal(recordRound(paused).reason, 'paused');
  assert.equal(paused.entries.length, 0);
});

test('all 108 rounds can be recorded and a 109th is refused', () => {
  let practice = newPractice(0);
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
  const first = recordRound(newPractice(0), 1000).practice;
  const expectedId = first.entries[0].id;
  const second = recordRound(first, 1000 + GUARD_MS).practice;
  assert.equal(undoRound(second, expectedId).reason, 'changed');
  const result = undoRound(second, second.entries[1].id);
  assert.equal(result.reason, 'undone');
  assert.deepEqual(result.practice.entries, first.entries);
  assert.equal(second.entries.length, 2);
});

test('undoing completion allows a corrected final round', () => {
  let practice = newPractice(0);
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
  const practice = recordRound(newPractice(0), 1234).practice;
  savePractice(storage, practice);
  assert.deepEqual(parsePractice(storage.getItem(STORAGE_KEY)), practice);
});

test('write failures and silent storage failures are surfaced', () => {
  const practice = newPractice();
  assert.throws(() => savePractice({ setItem() { throw new Error('Quota exceeded'); } }, practice));
  assert.throws(() => savePractice({ setItem() {}, getItem() { return null; } }, practice));
});

test('clock changes cannot create a duplicate or a negative receipt age', () => {
  const practice = recordRound(newPractice(0), 100_000).practice;
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
