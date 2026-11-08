'use strict';

const { randomUUID } = require('node:crypto');
const REPEATS = new Set(['once', 'daily', 'weekdays']);
const MAX_INTERACTIONS = 30;
const CATCH_UP_MS = 30 * 60 * 1000;

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sanitizeInteraction(value = {}) {
  value = value && typeof value === 'object' ? value : {};
  const time = typeof value.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.time) ? value.time : '11:10';
  return {
    id: typeof value.id === 'string' && /^[\w-]{1,80}$/.test(value.id) ? value.id : randomUUID(),
    content: typeof value.content === 'string' ? value.content.trim().slice(0, 300) : '',
    time,
    repeat: REPEATS.has(value.repeat) ? value.repeat : 'daily',
    enabled: value.enabled !== false,
    useModel: value.useModel !== false,
    lastRunAt: Number.isFinite(value.lastRunAt) && value.lastRunAt > 0 ? Math.round(value.lastRunAt) : 0,
    lastRunKey: typeof value.lastRunKey === 'string' ? value.lastRunKey.slice(0, 30) : '',
  };
}

function sanitizeInteractions(value) {
  if (!Array.isArray(value)) return [];
  const ids = new Set();
  return value.slice(0, MAX_INTERACTIONS).map(sanitizeInteraction).filter(task => {
    if (ids.has(task.id)) task.id = randomUUID();
    ids.add(task.id);
    return Boolean(task.content);
  });
}

function occurrenceFor(task, date) {
  const [hours, minutes] = task.time.split(':').map(Number);
  const occurrence = new Date(date);
  occurrence.setHours(hours, minutes, 0, 0);
  return occurrence;
}

/** 同一时刻只返回一个本地日期槽；30 分钟内允许锁屏或短暂休眠后补提醒。 */
function dueInteractions(tasks, now = new Date(), catchUpMs = CATCH_UP_MS) {
  const time = now.getTime();
  const due = [];
  for (const task of tasks || []) {
    if (!task.enabled) continue;
    for (const dayOffset of [0, -1]) {
      const day = new Date(time + dayOffset * 86400000);
      const occurrence = occurrenceFor(task, day);
      const age = time - occurrence.getTime();
      if (age < 0 || age > catchUpMs) continue;
      if (task.repeat === 'weekdays' && (occurrence.getDay() === 0 || occurrence.getDay() === 6)) continue;
      const key = `${localDateKey(occurrence)}T${task.time}`;
      if (task.lastRunKey === key || task.lastRunAt >= occurrence.getTime()) continue;
      due.push({ task, occurrence, key });
      break;
    }
  }
  return due.sort((a, b) => a.occurrence - b.occurrence);
}

function nextInteraction(tasks, now = new Date()) {
  let next = null;
  for (const task of tasks || []) {
    if (!task.enabled) continue;
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const day = new Date(now); day.setDate(day.getDate() + dayOffset);
      const occurrence = occurrenceFor(task, day);
      if (occurrence.getTime() <= now.getTime() || task.lastRunAt >= occurrence.getTime()) continue;
      if (task.repeat === 'weekdays' && (occurrence.getDay() === 0 || occurrence.getDay() === 6)) continue;
      if (!next || occurrence < next.occurrence) next = { task, occurrence, key: `${localDateKey(occurrence)}T${task.time}` };
      break;
    }
  }
  return next;
}

/** 复用已经绘制完成的动作，不为提醒另外生成或改写角色素材。 */
function interactionAction(content = '') {
  if (/跳舞|舞蹈|跳.*舞/.test(content)) return 'dance';
  if (/庆祝|恭喜|祝贺/.test(content)) return 'jump';
  if (/站起来|起身|活动|休息|放松|伸懒腰/.test(content)) return 'stretch';
  if (/晚安|睡觉|去睡/.test(content)) return 'sleep';
  if (/干饭|吃饭|喝水|吃点|餐|饿/.test(content)) return 'eat';
  if (/学习|工作|专注|看书|阅读/.test(content)) return 'review';
  return 'wave';
}

/** 面板未保存的旧草稿不能覆盖后台刚写入的触发状态。修改时间或重复规则则开始新排期。 */
function mergeInteractionRunState(incoming, current) {
  return (incoming || []).map(task => {
    const previous = (current || []).find(item => item.id === task.id);
    if (!previous || previous.time !== task.time || previous.repeat !== task.repeat || previous.lastRunAt <= task.lastRunAt) return task;
    return {
      ...task,
      enabled: previous.repeat === 'once' && !previous.enabled ? false : task.enabled,
      lastRunAt: previous.lastRunAt,
      lastRunKey: previous.lastRunKey,
    };
  });
}

function interactionPrompt(task, now = new Date()) {
  const time = `${localDateKey(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return `这是用户主动创建的定时互动，不是电脑操作指令。\n当前本地时间：${time}\n互动内容：${task.content}\n请以大肥鱼的身份主动发起这次互动，准确保留互动内容，不编造已经完成的事项。用简短、自然、有性格的中文说一段话，不超过80字，只输出要对用户说的话。`;
}

module.exports = {
  CATCH_UP_MS,
  MAX_INTERACTIONS,
  sanitizeInteraction,
  sanitizeInteractions,
  dueInteractions,
  nextInteraction,
  interactionAction,
  mergeInteractionRunState,
  interactionPrompt,
  localDateKey,
};
