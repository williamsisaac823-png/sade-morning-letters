import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidDate, validateNote, localToday, pickNote, formatDate } from '../pick.js';
import { NOTES } from '../notes.js';

const notes = [
  { date: '2026-11-10', text: 'a' },
  { date: '2026-11-14', text: 'b' },
  { date: '2026-11-20', text: 'c' },
];

test('exact day wins', () => assert.equal(pickNote(notes, '2026-11-14').text, 'b'));
test('falls back to newest past note', () => assert.equal(pickNote(notes, '2026-11-17').text, 'b'));
test('all future → earliest', () => assert.equal(pickNote(notes, '2026-01-01').text, 'a'));
test('after the last note → last', () => assert.equal(pickNote(notes, '2027-01-01').text, 'c'));
test('order in the file does not matter', () => assert.equal(pickNote([...notes].reverse(), '2026-11-15').text, 'b'));
test('empty or junk → null', () => {
  assert.equal(pickNote([], '2026-11-14'), null);
  assert.equal(pickNote(null, '2026-11-14'), null);
  assert.equal(pickNote([{ date: '2026-02-30', text: 'x' }, { date: '2026-11-01', text: '  ' }], '2026-11-14'), null);
});
test('invalid entries are skipped', () => {
  assert.equal(pickNote([{ date: 'soon', text: 'x' }, { date: '2026-11-01', text: 'ok' }], '2026-11-14').text, 'ok');
});
test('date validation', () => {
  assert.ok(isValidDate('2028-02-29'));
  assert.ok(!isValidDate('2026-02-29'));
  assert.ok(!isValidDate('2026-13-01'));
  assert.ok(!validateNote({ date: '2026-11-14' }));
});
test('local today uses local fields', () => {
  assert.equal(localToday(new Date(2026, 10, 14, 23, 30)), '2026-11-14');
});
test('postmark format', () => {
  assert.equal(formatDate('2026-11-14'), 'NOV 14 2026');
  assert.equal(formatDate('bad'), '');
});
test('every note in notes.js is valid', () => {
  assert.ok(NOTES.length >= 1);
  for (const n of NOTES) assert.ok(validateNote(n), JSON.stringify(n));
});
