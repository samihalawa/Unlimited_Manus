const { v4: uuidv4 } = require('uuid');
const { buildBrowserPrompt } = require('@src/utils/browserPrompt');
const { runComputerUseAutomation } = require('@src/utils/stagehand');

const ALLOWED_INTENTS = new Set(['navigational', 'informational', 'transactional']);

const formatInstruction = ({ url, intent, focus, brief }) => {
  const basePrompt = buildBrowserPrompt({ url, intent, focus });
  const supplemental = [
    'Use the browser to gather the most relevant information for the task.',
    'Avoid logging in or submitting forms unless explicitly required.',
    'Finish by summarising key findings in plain text.',
  ];
  if (brief) {
    supplemental.unshift(`Additional context: ${brief}`);
  }
  return `${basePrompt}\n\n${supplemental.join(' ')}`.trim();
};

const browserTool = {
  name: 'browser',
  description: 'Control a real browser via Gemini Computer Use to open pages, explore content, and summarise findings.',
  params: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Target URL to open, including protocol.',
      },
      intent: {
        type: 'string',
        enum: ['navigational', 'informational', 'transactional'],
        description: 'High-level goal for the browsing task.',
      },
      focus: {
        type: 'string',
        description: 'Optional focal point or question to answer on the page.',
      },
      brief: {
        type: 'string',
        description: 'Optional extra guidance for the automation agent.',
      },
      max_steps: {
        type: 'integer',
        description: 'Optional override for the maximum computer-use steps (default 25).',
      },
    },
    required: ['url', 'intent'],
  },
  getActionDescription: async ({ url, intent }) => {
    const intentLabel = intent || 'informational';
    return `Automating browser visit to ${url || 'the requested URL'} with ${intentLabel} intent`;
  },
  execute: async (params = {}, uuid = uuidv4(), context = {}) => {
    const { url, intent, focus = '', brief = '', max_steps: maxStepsOverride } = params;
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      throw new Error('url must be an absolute URL including http/https.');
    }
    if (!ALLOWED_INTENTS.has(intent)) {
      throw new Error(`intent must be one of ${Array.from(ALLOWED_INTENTS).join(', ')}`);
    }

    const instruction = formatInstruction({ url, intent, focus, brief });

    try {
      const result = await runComputerUseAutomation({
        url,
        instruction,
        maxSteps: maxStepsOverride,
      });

      const summary = result?.message
        ? result.message
        : `Browser automation ${result?.success === false ? 'encountered issues' : 'completed'} for ${url}.`;

      const trimmedActions = Array.isArray(result?.actions)
        ? result.actions.slice(-5)
        : [];

      const payload = {
        url,
        intent,
        focus,
        success: result?.success ?? false,
        completed: result?.completed ?? false,
        message: result?.message ?? '',
        usage: result?.usage ?? null,
        captured_actions: trimmedActions,
      };

      return {
        content: summary,
        meta: {
          action_type: 'browser.navigate',
          json: [payload],
          url,
          intent,
          focus,
          success: payload.success,
          completed: payload.completed,
          usage: payload.usage,
          actions: payload.captured_actions,
          content: JSON.stringify(result ?? {}),
        },
      };
    } catch (error) {
      const message = error?.message || 'Unknown browser automation error';
      throw new Error(`Gemini computer-use automation failed: ${message}`);
    }
  },
};

module.exports = browserTool;
