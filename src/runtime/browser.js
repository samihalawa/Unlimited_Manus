const { buildBrowserPrompt } = require('@src/utils/browserPrompt');
const { runComputerUseAutomation } = require('@src/utils/stagehand');

async function browser(action, uuid) {
  const { params = {} } = action;
  if (!params.question && params.url && params.intent) {
    params.question = buildBrowserPrompt({
      url: params.url,
      intent: params.intent,
      focus: params.focus,
    });
  }
  if (!params.question) {
    throw new Error('Browser prompt is missing. Ensure url and intent are provided.');
  }
  const result = await runComputerUseAutomation({
    url: params.url,
    instruction: params.question,
    maxSteps: params.max_steps,
  });

  return {
    uuid,
    status: result?.success === false ? 'failure' : 'success',
    content: result?.message || 'Browser automation completed.',
    meta: {
      action_type: 'browser',
      json: [{
        url: params.url,
        success: result?.success ?? false,
        completed: result?.completed ?? false,
        actions: Array.isArray(result?.actions) ? result.actions.slice(-5) : [],
        usage: result?.usage ?? null,
      }],
      content: JSON.stringify(result ?? {}),
    }
  };
}


module.exports = browser;
