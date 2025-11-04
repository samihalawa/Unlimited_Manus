const DEFAULT_MAX_STEPS = Number(process.env.BROWSER_AUTOMATION_MAX_STEPS || 25);
const DEFAULT_MODEL = process.env.GEMINI_COMPUTER_USE_MODEL || 'google/gemini-2.5-computer-use-preview-10-2025';
const VIEWPORT = {
  width: Number(process.env.BROWSER_AUTOMATION_VIEWPORT_WIDTH || 1288),
  height: Number(process.env.BROWSER_AUTOMATION_VIEWPORT_HEIGHT || 711),
};

const missingEnv = (name) => !process.env[name] || String(process.env[name]).trim() === '';

const ensureEnvironment = () => {
  const required = ['BROWSERBASE_API_KEY', 'BROWSERBASE_PROJECT_ID', 'GEMINI_API_KEY'];
  const missing = required.filter(missingEnv);
  if (missing.length) {
    throw new Error(`Missing required environment variables for computer-use automation: ${missing.join(', ')}`);
  }
};

let stagehandModulePromise;
const loadStagehand = () => {
  if (!stagehandModulePromise) {
    stagehandModulePromise = import('@browserbasehq/stagehand');
  }
  return stagehandModulePromise;
};

const buildSystemPrompt = () => {
  return [
    'You control a real browser on behalf of LemonAI.',
    'Carry out instructions carefully, avoid destructive actions, and capture key findings.',
    'When the goal is met, provide a concise textual summary.',
  ].join(' ');
};

/**
 * Execute a single Gemini Computer Use session via Stagehand.
 * @param {object} options
 * @param {string} options.url
 * @param {string} options.instruction
 * @param {number} [options.maxSteps]
 * @returns {Promise<import('@browserbasehq/stagehand').AgentResult>}
 */
const runComputerUseAutomation = async ({ url, instruction, maxSteps }) => {
  ensureEnvironment();

  const { Stagehand } = await loadStagehand();
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    browserbaseSessionCreateParams: {
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      browserSettings: {
        blockAds: true,
        viewport: { ...VIEWPORT },
      },
    },
    model: {
      provider: 'google',
      modelName: DEFAULT_MODEL,
      apiKey: process.env.GEMINI_API_KEY,
    },
    systemPrompt: buildSystemPrompt(),
    verbose: 0,
  });

  let agent;
  try {
    await stagehand.init();

    agent = stagehand.agent({
      cua: true,
      systemPrompt: buildSystemPrompt(),
      model: {
        modelName: DEFAULT_MODEL,
        apiKey: process.env.GEMINI_API_KEY,
      },
    });

    const computerUseInstruction = [
      `Start at ${url}.`,
      instruction,
      'If navigation fails, report the issue and stop.',
    ].join(' ');

    const result = await agent.execute({
      instruction: computerUseInstruction,
      maxSteps: Number.isInteger(maxSteps) && maxSteps > 0 ? maxSteps : DEFAULT_MAX_STEPS,
      highlightCursor: true,
    });

    return result;
  } finally {
    try {
      await stagehand.close();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[stagehand] Failed to close session cleanly:', error?.message || error);
    }
  }
};

module.exports = {
  runComputerUseAutomation,
};
