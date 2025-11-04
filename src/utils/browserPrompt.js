const buildBrowserPrompt = ({ url, intent, focus }) => {
  const segments = [
    `URL: ${url}`,
    `Intent: ${intent}`,
  ];
  if (intent === 'informational' && focus) {
    segments.push(`Focus: ${focus}`);
  }
  const guidance = [
    `Navigate to ${url} with ${intent} intent.`,
    intent === 'informational' && focus ? `Focus on: ${focus}.` : '',
    'Collect relevant information and summarise key findings.',
  ].filter(Boolean);
  return `${guidance.join(' ')}\n\n${segments.join('\n')}`.trim();
};

module.exports = {
  buildBrowserPrompt,
};
