const generateTool = {
  name: 'generate',
  description: 'Enter generation mode to create or edit multimedia content such as images, video, audio, or speech.',
  params: {
    type: 'object',
    properties: {
      brief: {
        type: 'string',
        description: 'Optional context describing the generation goal.',
      },
    },
  },
  getActionDescription: async ({ brief }) => {
    return brief ? `Entering generation mode: ${brief}` : 'Entering generation mode';
  },
  execute: async (params = {}, _uuid, context = {}) => {
    context.active_modes = context.active_modes || new Set();
    context.active_modes.add('generate');
    const brief = params.brief ? `Goal: ${params.brief}` : 'Ready for multimedia generation instructions.';
    return {
      content: `Generation mode enabled. ${brief}`,
      meta: {
        json: [{ mode: 'generate', brief: params.brief || '' }],
      },
    };
  },
};

module.exports = generateTool;
