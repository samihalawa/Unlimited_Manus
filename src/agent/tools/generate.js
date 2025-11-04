/**
 * Generate tool for entering generation mode
 * Activates a special mode for content generation
 */

const Generate = {
  name: "generate",
  description: "Enter generation mode for specialized content generation. This activates a mode optimized for creating content, code, or other artifacts. Returns a mode activation event.",
  params: {
    type: "object",
    properties: {
      mode_type: {
        description: "Type of generation mode (e.g., 'content', 'code', 'data')",
        type: "string"
      },
      description: {
        description: "Description of what will be generated",
        type: "string"
      }
    },
    required: []
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { mode_type } = args;
    return `Entering generation mode${mode_type ? ': ' + mode_type : ''}`;
  },
  
  async execute(args, uuid, context) {
    const { mode_type = 'default', description = '' } = args;
    
    try {
      // Set generation mode in context
      context.generation_mode = {
        active: true,
        type: mode_type,
        description,
        activated_at: new Date().toISOString()
      };
      
      return {
        status: 'success',
        content: `Generation mode activated${mode_type ? ': ' + mode_type : ''}${description ? '\n' + description : ''}`,
        meta: {
          action_type: 'generate',
          mode: context.generation_mode,
          json: context.generation_mode
        }
      };
    } catch (error) {
      console.error('Generate tool error:', error);
      return {
        status: 'failure',
        content: `Generation mode activation failed: ${error.message}`,
        meta: { action_type: 'generate' }
      };
    }
  }
};

module.exports = Generate;
