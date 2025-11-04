const fs = require('fs').promises;
const path = require('path');
const { getDirpath } = require('@src/utils/electron');

const SCHEDULE_DIR = getDirpath('Caches/schedule');

const ensureDir = async () => {
  try {
    await fs.mkdir(SCHEDULE_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

const resolveSchedulePath = (conversationId) => {
  if (!conversationId) {
    throw new Error('conversation_id is required to persist schedule entries.');
  }
  return path.join(SCHEDULE_DIR, `${conversationId}.json`);
};

const loadSchedules = async (conversationId) => {
  await ensureDir();
  const filepath = resolveSchedulePath(conversationId);
  try {
    const raw = await fs.readFile(filepath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const saveSchedules = async (conversationId, schedules) => {
  await ensureDir();
  const filepath = resolveSchedulePath(conversationId);
  await fs.writeFile(filepath, JSON.stringify(schedules, null, 2), 'utf8');
};

const addSchedule = async (conversationId, entry) => {
  const schedules = await loadSchedules(conversationId);
  schedules.push(entry);
  await saveSchedules(conversationId, schedules);
  return entry;
};

module.exports = {
  loadSchedules,
  addSchedule,
};
