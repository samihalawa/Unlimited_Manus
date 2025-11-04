const { v4: uuidv4 } = require('uuid');
const { updatePlan, advancePlan } = require('@src/utils/planStore');

const formatPhaseForDisplay = (phase, index) => {
  return {
    id: phase.id,
    description: `${index + 1}. ${phase.title}`,
    status: phase.status,
    meta: {
      capabilities: phase.capabilities || {},
    },
  };
};

const resolveConversationId = (params = {}, context = {}) => {
  return params.conversation_id || context.conversation_id;
};

const planTool = {
  name: 'plan',
  description: 'Create, update, and advance the structured task plan used to guide multi-phase execution.',
  params: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['update', 'advance'],
        description: 'The plan operation to perform.',
      },
      goal: {
        type: 'string',
        description: 'The overall goal for the plan. Required when action is update.',
      },
      phases: {
        type: 'array',
        description: 'List of phases required to achieve the goal. Required when action is update.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            capabilities: { type: 'object' },
            status: { type: 'string' },
          },
        },
      },
      current_phase_id: {
        type: 'integer',
        description: 'ID of the current active phase in the plan.',
      },
      next_phase_id: {
        type: 'integer',
        description: 'ID of the phase to advance to when action is advance.',
      },
    },
    required: ['action'],
  },
  getActionDescription: async ({ action }) => {
    switch (action) {
      case 'update':
        return 'Updating structured task plan';
      case 'advance':
        return 'Advancing to the next phase of the plan';
      default:
        return 'Managing task plan';
    }
  },
  execute: async (params, uuid = uuidv4(), context = {}) => {
    const { action } = params || {};
    const conversationId = resolveConversationId(params, context);
    if (!conversationId) {
      throw new Error('conversation_id is required to use the plan tool.');
    }

    if (action === 'update') {
      const { goal, phases, current_phase_id } = params;
      const plan = await updatePlan(conversationId, { goal, phases, current_phase_id });
      const phasesForDisplay = plan.phases.map((phase, index) => formatPhaseForDisplay(phase, index));
      const activePhase = plan.phases.find(phase => phase.id === plan.current_phase_id);
      const contentLines = [
        `### Plan Goal`,
        goal,
        '',
        `**Current Phase:** ${activePhase ? activePhase.title : 'Not started'}`,
      ];
      return {
        content: contentLines.join('\n'),
        meta: {
          json: phasesForDisplay,
          content: JSON.stringify(plan),
        },
      };
    }

    if (action === 'advance') {
      const { current_phase_id, next_phase_id } = params;
      if (typeof current_phase_id === 'undefined' || typeof next_phase_id === 'undefined') {
        throw new Error('Both current_phase_id and next_phase_id are required for advance action.');
      }
      const plan = await advancePlan(conversationId, { current_phase_id, next_phase_id });
      const phasesForDisplay = plan.phases.map((phase, index) => formatPhaseForDisplay(phase, index));
      const activePhase = plan.phases.find(phase => phase.id === plan.current_phase_id);
      const contentLines = [
        `Advanced plan to phase ${plan.current_phase_id}.`,
        activePhase ? `Now working on: ${activePhase.title}` : 'All phases completed.',
      ];
      return {
        content: contentLines.join(' '),
        meta: {
          json: phasesForDisplay,
          content: JSON.stringify(plan),
        },
      };
    }

    throw new Error(`Unsupported plan action: ${action}`);
  },
};

module.exports = planTool;
