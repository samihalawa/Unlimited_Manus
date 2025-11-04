/**
 * Message tool for user communication
 * Types: info (general information), ask (question requiring user response), result (final deliverable)
 */

const Message = {
  name: "message",
  description: "Send messages to interact with the user. Use 'info' for acknowledgment or progress updates, 'ask' to request user input (blocks until response), 'result' to deliver final results.",
  params: {
    type: "object",
    properties: {
      attachments: {
        description: "A list of attachments to include with the message",
        type: "array",
        items: {
          type: "string"
        }
      },
      suggested_action: {
        description: "The suggested action for the user to take. Optional and only used for 'ask' type.",
        type: "string",
        enum: ["none", "confirm_browser_operation", "take_over_browser", "upgrade_to_unlock_feature"]
      },
      text: {
        description: "The message or question text to be shown to the user",
        type: "string"
      },
      type: {
        description: "The type of the message",
        type: "string",
        enum: ["info", "ask", "result"]
      }
    },
    required: ["type", "text"]
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { type, text } = args;
    if (type === 'ask') {
      return `Asking user: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`;
    } else if (type === 'result') {
      return `Delivering final result`;
    }
    return `Message: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`;
  },
  
  async execute(args, uuid, context) {
    const { type, text, attachments = [], suggested_action = 'none' } = args;
    
    try {
      if (type === 'ask') {
        // For 'ask' type, we need to block execution until user responds
        // Store the question in context and wait for response
        const questionId = uuid;
        
        // Create a promise that will be resolved when user responds
        const responsePromise = new Promise((resolve) => {
          // Store resolver in context for later use
          if (!context.pendingQuestions) {
            context.pendingQuestions = new Map();
          }
          context.pendingQuestions.set(questionId, resolve);
        });
        
        // Return asking status immediately
        const askResult = {
          status: 'asking',
          content: text,
          meta: {
            action_type: 'message',
            message_type: 'ask',
            question_id: questionId,
            requires_response: true,
            suggested_action
          }
        };
        
        // Wait for user response (this will be resolved by agent when user answers)
        // For now, we return asking state and the agent loop should handle pausing
        return askResult;
        
      } else if (type === 'result') {
        // Result type - final deliverable
        return {
          status: 'success',
          content: text,
          meta: {
            action_type: 'message',
            message_type: 'result',
            attachments: attachments,
            json: attachments.map(path => ({ path, type: 'file' }))
          }
        };
        
      } else if (type === 'info') {
        // Info type - general information
        return {
          status: 'success',
          content: text,
          meta: {
            action_type: 'message',
            message_type: 'info'
          }
        };
        
      } else {
        return {
          status: 'failure',
          content: `Unknown message type: ${type}. Use 'info', 'ask', or 'result'.`,
          meta: { action_type: 'message' }
        };
      }
    } catch (error) {
      console.error('Message tool error:', error);
      return {
        status: 'failure',
        content: `Message tool failed: ${error.message}`,
        meta: { action_type: 'message' }
      };
    }
  }
};

module.exports = Message;
