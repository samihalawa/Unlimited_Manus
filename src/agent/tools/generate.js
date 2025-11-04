/**
 * Generate tool for entering generation mode
 * Activates a special mode for content generation
 */

const buildGenerateMeta = (extra = {}) => ({
  action_type: 'generate.activate',
  tool: 'generate',
  mode: 'generation',
  ...extra,
});

const Generate = {
  name: "generate",
  description: "Enter generation mode for specialized content generation. This activates a mode optimized for creating content, code, or other artifacts. Returns a mode activation event.",
  params: {
    type: "object",
    properties: {
      brief: {
        description: "A one-sentence preamble describing the purpose of this operation",
        type: "string"
      }
    },
    required: []
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { brief } = args;
    if (brief) return brief;
    return `Entering generation mode`;
  },
  
  async execute(args, uuid, context) {
    const { brief } = args;
    
    try {
      // Set generation mode in context
      context.generation_mode = {
        active: true,
        activated_at: new Date().toISOString()
      };
      
      return {
        status: 'success',
        content: `Generation mode activated`,
        meta: buildGenerateMeta({
          active: true,
          activated_at: context.generation_mode.activated_at,
          json: context.generation_mode
        })
      };
    } catch (error) {
      console.error('Generate tool error:', error);
      return {
        status: 'failure',
        content: `Generation mode activation failed: ${error.message}`,
        meta: buildGenerateMeta({ error: true })
      };
    }
  }
};

module.exports = Generate;
