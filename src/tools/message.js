const path = require('path');
const { v4: uuidv4 } = require('uuid');

const allowedTypes = new Set(['info', 'ask', 'result']);
const allowedSuggestedActions = new Set(['none', 'confirm_browser_operation', 'take_over_browser', 'upgrade_to_unlock_feature']);

const messageTool = {
  name: 'message',
  description: 'Send a structured message to the user. Supports informational updates, questions, and final results with optional attachments.',
  params: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['info', 'ask', 'result'],
        description: 'Message channel type.',
      },
      text: {
        type: 'string',
        description: 'The message text to deliver to the user.',
      },
      attachments: {
        type: 'array',
        description: 'Attachment references to include with the message.',
        items: { type: 'string' },
      },
      suggested_action: {
        type: 'string',
        enum: ['none', 'confirm_browser_operation', 'take_over_browser', 'upgrade_to_unlock_feature'],
        description: 'Optional suggested follow-up action for ask-type messages.',
      },
    },
    required: ['type', 'text'],
  },
  getActionDescription: async ({ type }) => {
    if (!type) {
      return 'Sending message to user';
    }
    return `Sending ${type} message to user`;
  },
  execute: async (params = {}, uuid = uuidv4()) => {
    const { type, text, attachments = [], suggested_action = 'none' } = params;

    if (!allowedTypes.has(type)) {
      throw new Error(`Unsupported message type "${type}". Expected one of ${Array.from(allowedTypes).join(', ')}`);
    }
    if (!text || typeof text !== 'string') {
      throw new Error('text must be a non-empty string.');
    }
    if (!Array.isArray(attachments)) {
      throw new Error('attachments must be an array of strings when provided.');
    }
    if (!allowedSuggestedActions.has(suggested_action)) {
      throw new Error(`Invalid suggested_action "${suggested_action}".`);
    }

    const attachmentList = attachments
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => ({
        filepath: item,
        name: path.basename(item),
      }));

    return {
      content: text,
      meta: {
        json: attachmentList,
        content: JSON.stringify({
          type,
          attachments: attachmentList,
          suggested_action,
          message_uuid: uuid,
        }),
      },
    };
  },
};

module.exports = messageTool;
