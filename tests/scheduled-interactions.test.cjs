'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CATCH_UP_MS,
  MAX_INTERACTIONS,
  sanitizeInteraction,
  sanitizeInteractions,
  dueInteractions,
  nextInteraction,
  interactionAction,
  mergeInteractionRunState,
  interactionPrompt,
} = require('../src/main/scheduled-interactions.cjs');
const { sanitizeSettings } = require('../src/main/settings.cjs');

const task = (extra = {}) => sanitizeInteraction({ id: 'meal', content: '提醒我吃饭', time: '11:10', repeat: 'daily', ...extra });

test('interaction sanitization bounds user input and keeps model choice', () => {
  const value = sanitizeInteraction({ id: 'rest', content: '  起来活动一下  ', time: '15:20', repeat: 'weekdays', enabled: false, useModel: false });
  assert.equal(value.content, '起来活动一下');
  assert.equal(value.time, '15:20');
  assert.equal(value.repeat, 'weekdays');
  assert.equal(value.enabled, false);
  assert.equal(value.useModel, false);
  assert.equal(sanitizeInteraction({ content: 'x', time: '28:90' }).time, '11:10');
  assert.equal(sanitizeInteraction({ content: '好'.repeat(400) }).content.length, 300);
});

test('empty tasks are removed, count is bounded and duplicate ids cannot share run state', () => {
  const values = Array.from({ length: 40 }, () => ({ id: 'same', content: '喝水', time: '10:00' }));
  values.push({ content: '   ' });
  const result = sanitizeInteractions(values);
  assert.equal(result.length, MAX_INTERACTIONS);
  assert.equal(new Set(result.map(item => item.id)).size, result.length);
  assert.deepEqual(sanitizeSettings({ scheduledInteractions: values }).scheduledInteractions.length, MAX_INTERACTIONS);
});

test('daily task is due in its local minute and can catch up for thirty minutes', () => {
  const value = task();
  assert.equal(dueInteractions([value], new Date(2026, 10, 5, 11, 9)).length, 0);
  const due = dueInteractions([value], new Date(2026, 10, 5, 11, 10));
  assert.equal(due.length, 1);
  assert.equal(due[0].key, '2026-11-05T11:10');
  assert.equal(dueInteractions([value], new Date(2026, 10, 5, 11, 40)).length, 1);
  assert.equal(dueInteractions([value], new Date(2026, 10, 5, 11, 41)).length, 0);
  assert.equal(CATCH_UP_MS, 30 * 60 * 1000);
});

test('same local date slot never fires twice, including after midnight catch-up', () => {
  const late = task({ time: '23:55', lastRunKey: '2026-11-05T23:55', lastRunAt: new Date(2026, 10, 5, 23, 55).getTime() });
  assert.equal(dueInteractions([late], new Date(2026, 10, 6, 0, 5)).length, 0);
  const tomorrow = task({ lastRunKey: '2026-11-05T11:10', lastRunAt: new Date(2026, 10, 5, 11, 10).getTime() });
  assert.equal(dueInteractions([tomorrow], new Date(2026, 10, 6, 11, 10)).length, 1);
});

test('weekday tasks skip Saturday and Sunday but run Monday', () => {
  const value = task({ repeat: 'weekdays' });
  assert.equal(dueInteractions([value], new Date(2026, 10, 7, 11, 10)).length, 0);
  assert.equal(dueInteractions([value], new Date(2026, 10, 8, 11, 10)).length, 0);
  assert.equal(dueInteractions([value], new Date(2026, 10, 9, 11, 10)).length, 1);
});

test('disabled tasks do not fire and stale panel drafts cannot erase newer run state', () => {
  assert.equal(dueInteractions([task({ enabled: false })], new Date(2026, 10, 5, 11, 10)).length, 0);
  const current = task({ repeat: 'once', enabled: false, lastRunAt: 2000, lastRunKey: 'new-slot' });
  const stale = task({ repeat: 'once', enabled: true, lastRunAt: 1000, lastRunKey: 'old-slot' });
  assert.deepEqual(mergeInteractionRunState([stale], [current])[0], current);
  const rescheduled = { ...stale, time: '12:00' };
  assert.deepEqual(mergeInteractionRunState([rescheduled], [current])[0], rescheduled);
});

test('model prompt contains only the scheduled text and local time context', () => {
  const prompt = interactionPrompt(task({ content: '提醒我喝水，再问我工作顺不顺利' }), new Date(2026, 10, 5, 11, 10));
  assert.match(prompt, /2026-11-05 11:10/);
  assert.match(prompt, /提醒我喝水，再问我工作顺不顺利/);
  assert.match(prompt, /不超过80字/);
  assert.match(prompt, /不编造已经完成的事项/);
});

test('next interaction rolls daily tasks to tomorrow and weekdays to Monday', () => {
  const daily = task();
  const weekday = task({ id: 'weekday', repeat: 'weekdays' });
  const thursday = nextInteraction([daily], new Date(2026, 10, 5, 12, 0));
  assert.equal(thursday.key, '2026-11-06T11:10');
  const friday = nextInteraction([weekday], new Date(2026, 10, 6, 12, 0));
  assert.equal(friday.key, '2026-11-09T11:10');
  assert.equal(nextInteraction([task({ enabled: false })], new Date(2026, 10, 5, 12, 0)), null);
});

test('scheduled content selects only existing appropriate animations', () => {
  assert.equal(interactionAction('提醒我站起来活动，再喝水'), 'stretch');
  assert.equal(interactionAction('提醒我干饭'), 'eat');
  assert.equal(interactionAction('陪我跳一小段舞'), 'dance');
  assert.equal(interactionAction('庆祝完成这一阶段'), 'jump');
  assert.equal(interactionAction('提醒我专注学习'), 'review');
  assert.equal(interactionAction('随便聊两句'), 'wave');
});
