const { v4: uuidv4 } = require('uuid');
const { addSchedule, loadSchedules } = require('@src/utils/scheduleStore');

const scheduleTool = {
  name: 'schedule',
  description: 'Schedule tasks to run at a specified time or recurring interval.',
  params: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['cron', 'interval'],
        description: 'Scheduling mode to use.',
      },
      cron: {
        type: 'string',
        description: 'Cron expression used when type is cron.',
      },
      interval: {
        type: 'integer',
        description: 'Interval in seconds when type is interval.',
      },
      name: {
        type: 'string',
        description: 'Human-readable name for the scheduled task.',
      },
      prompt: {
        type: 'string',
        description: 'Description of the task to execute when the schedule triggers.',
      },
      repeat: {
        type: 'boolean',
        description: 'Whether the task should repeat after execution.',
      },
      brief: {
        type: 'string',
        description: 'Optional note about the schedule (unused by backend).',
      },
      playbook: {
        type: 'string',
        description: 'Optional playbook content describing repeatable steps.',
      },
    },
    required: ['type', 'name', 'prompt'],
  },
  getActionDescription: async ({ type, name }) => {
    return `Scheduling ${type || 'cron'} task: ${name || ''}`.trim();
  },
  execute: async (params = {}, uuid, context = {}) => {
    const { type, cron, interval, name, prompt, repeat = false, playbook = '' } = params;
    const conversationId = params.conversation_id || context.conversation_id;
    if (!conversationId) {
      throw new Error('conversation_id is required to create schedules.');
    }

    if (type === 'cron') {
      if (!cron || typeof cron !== 'string') {
        throw new Error('cron expression is required for cron schedules.');
      }
    } else if (type === 'interval') {
      if (typeof interval !== 'number' || interval <= 0) {
        throw new Error('interval must be a positive number of seconds for interval schedules.');
      }
      if (repeat && interval < 3600) {
        throw new Error('Recurring interval schedules must be at least 3600 seconds (1 hour).');
      }
    } else {
      throw new Error(`Unsupported schedule type "${type}".`);
    }

    const entry = {
      id: uuidv4(),
      type,
      cron: type === 'cron' ? cron : null,
      interval: type === 'interval' ? interval : null,
      repeat: Boolean(repeat),
      name,
      prompt,
      playbook,
      created_at: new Date().toISOString(),
    };

    await addSchedule(conversationId, entry);
    const schedules = await loadSchedules(conversationId);
    const summary = `Scheduled task "${name}" (${type}${repeat ? ', repeating' : ''}).`;

    return {
      content: summary,
      meta: {
        json: schedules,
      },
    };
  },
};

module.exports = scheduleTool;
