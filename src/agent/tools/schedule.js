/**
 * Schedule tool for task scheduling
 * Types: cron (cron expression), interval (periodic execution)
 * Note: This is a create-only tool. Execution engine needs to be set up separately.
 */

const buildScheduleMeta = (scheduleType, extra = {}) => ({
  action_type: `schedule.${scheduleType}`,
  tool: 'schedule',
  schedule_type: scheduleType,
  ...extra,
});

const Schedule = {
  name: "schedule",
  description: "Schedule tasks for recurring execution. Use 'cron' type with cron expression (e.g., '0 9 * * *' for daily at 9am) or 'interval' type with interval in minutes. Only creation is supported; execution engine to be implemented separately.",
  params: {
    type: "object",
    properties: {
      brief: {
        description: "A one-sentence preamble describing the purpose of this operation",
        type: "string"
      },
      type: {
        description: "Schedule type: 'cron' for cron expression or 'interval' for periodic execution",
        type: "string",
        enum: ["cron", "interval"]
      },
      name: {
        description: "Name/description of the scheduled task",
        type: "string"
      },
      cron: {
        description: "Cron expression (required for 'cron' type, e.g., '0 9 * * *' for daily at 9am)",
        type: "string"
      },
      interval: {
        description: "Interval in minutes (required for 'interval' type)",
        type: "integer"
      },
      repeat: {
        description: "Number of times to repeat (optional, omit for infinite)",
        type: "integer"
      },
      prompt: {
        description: "Prompt/instruction to execute when scheduled task runs",
        type: "string"
      },
      playbook: {
        description: "Optional playbook identifier to run",
        type: "string"
      }
    },
    required: ["type", "name"]
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { type, name, brief } = args;
    if (brief) return brief;
    return `Scheduling ${type} task: ${name}`;
  },
  
  async execute(args, uuid, context) {
    const { type, name, cron, interval, repeat, prompt, playbook } = args;
    
    try {
      if (type === 'cron') {
        if (!cron) {
          return {
            status: 'failure',
            content: 'cron expression is required for cron type',
            meta: buildScheduleMeta('cron')
          };
        }
        
        // Validate cron expression (basic check)
        const cronParts = cron.split(/\s+/);
        if (cronParts.length < 5) {
          return {
            status: 'failure',
            content: 'Invalid cron expression. Expected format: "minute hour day month weekday"',
            meta: buildScheduleMeta('cron')
          };
        }
        
        // Create schedule spec
        const scheduleSpec = {
          id: uuid,
          user_id: context.user_id,
          conversation_id: context.conversation_id,
          type: 'cron',
          name,
          cron,
          repeat: repeat || null,
          prompt: prompt || null,
          playbook: playbook || null,
          created_at: new Date().toISOString()
        };
        
        // TODO: Persist to database when ScheduledTask model is created
        // await ScheduledTask.create(scheduleSpec);
        
        // For now, store in context
        if (!context.schedules) {
          context.schedules = [];
        }
        context.schedules.push(scheduleSpec);
        
        return {
          status: 'success',
          content: `Scheduled cron task: ${name}\nExpression: ${cron}${repeat ? `\nRepeats: ${repeat} times` : '\nRepeats: indefinitely'}`,
          meta: buildScheduleMeta('cron', {
            schedule: scheduleSpec,
            json: scheduleSpec
          })
        };
        
      } else if (type === 'interval') {
        if (!interval) {
          return {
            status: 'failure',
            content: 'interval (in minutes) is required for interval type',
            meta: buildScheduleMeta('interval')
          };
        }
        
        if (interval < 1) {
          return {
            status: 'failure',
            content: 'interval must be at least 1 minute',
            meta: buildScheduleMeta('interval')
          };
        }
        
        // Create schedule spec
        const scheduleSpec = {
          id: uuid,
          user_id: context.user_id,
          conversation_id: context.conversation_id,
          type: 'interval',
          name,
          interval,
          repeat: repeat || null,
          prompt: prompt || null,
          playbook: playbook || null,
          created_at: new Date().toISOString()
        };
        
        // TODO: Persist to database when ScheduledTask model is created
        // await ScheduledTask.create(scheduleSpec);
        
        // For now, store in context
        if (!context.schedules) {
          context.schedules = [];
        }
        context.schedules.push(scheduleSpec);
        
        return {
          status: 'success',
          content: `Scheduled interval task: ${name}\nInterval: every ${interval} minute(s)${repeat ? `\nRepeats: ${repeat} times` : '\nRepeats: indefinitely'}`,
          meta: buildScheduleMeta('interval', {
            schedule: scheduleSpec,
            json: scheduleSpec
          })
        };
        
      } else {
        return {
          status: 'failure',
          content: `Unknown schedule type: ${type}`,
          meta: buildScheduleMeta(type || 'unknown')
        };
      }
    } catch (error) {
      console.error('Schedule tool error:', error);
      return {
        status: 'failure',
        content: `Schedule creation failed: ${error.message}`,
        meta: buildScheduleMeta(type || 'error')
      };
    }
  }
};

module.exports = Schedule;
