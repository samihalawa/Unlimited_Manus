const { v4: uuidv4 } = require('uuid');
const WebSearchTool = require('./WebSearch');

const SEARCH_TYPES = new Set(['info', 'image', 'api', 'news', 'tool', 'data', 'research']);
const TIME_FILTERS = new Set(['all', 'past_day', 'past_week', 'past_month', 'past_year']);

const searchTool = {
  name: 'search',
  description: 'Search across web sources for information, images, APIs, tools, datasets, or research material.',
  params: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: Array.from(SEARCH_TYPES),
        description: 'Search modality to prioritise.',
      },
      queries: {
        type: 'array',
        description: 'Up to 3 query variants expressing the same information need.',
        items: { type: 'string' },
      },
      time: {
        type: 'string',
        enum: Array.from(TIME_FILTERS),
        description: 'Optional time filter.',
      },
      brief: {
        type: 'string',
        description: 'Optional note about the search purpose.',
      },
    },
    required: ['type', 'queries'],
  },
  getActionDescription: async ({ type, queries }) => {
    const queryPreview = Array.isArray(queries) && queries.length ? queries[0] : '';
    return `Running ${type || 'info'} search for "${queryPreview}"`;
  },
  execute: async (params = {}, uuid = uuidv4(), context = {}) => {
    const { type, queries = [], time = 'all' } = params;
    const conversationId = params.conversation_id || context.conversation_id;

    if (!SEARCH_TYPES.has(type)) {
      throw new Error(`Unsupported search type "${type}".`);
    }
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('queries must include at least one search string.');
    }
    if (queries.length > 3) {
      throw new Error('queries may contain at most 3 items.');
    }
    if (!TIME_FILTERS.has(time)) {
      throw new Error(`Unsupported time filter "${time}".`);
    }

    const results = [];
    for (const query of queries) {
      const augmentedQuery = time === 'all' ? query : `${query} time:${time.replace('_', '-')}`;
      try {
        const response = await WebSearchTool.execute({
          query: augmentedQuery,
          num_results: 5,
          conversation_id: conversationId,
        }, uuid, context);
        results.push({
          query,
          applied_query: augmentedQuery,
          summary: response.content,
          data: response.meta?.json || [],
        });
      } catch (error) {
        results.push({
          query,
          applied_query: augmentedQuery,
          error: error.message,
          data: [],
        });
      }
    }

    const summaryLines = results.map((entry, index) => {
      const label = entry.error
        ? `Error: ${entry.error}`
        : `${entry.data.length} result(s)`;
      return `Query ${index + 1} "${entry.query}": ${label}`;
    });

    const provider = results.find(entry => entry.data?.provider)?.data?.provider || 'default';
    const images = results.flatMap(entry => entry.data?.images || []);

    return {
      content: [`Search type: ${type}`, ...summaryLines].join('\n'),
      meta: {
        action_type: `search.${type}`,
        provider,
        queries,
        time_filter: time,
        results,
        images,
        json: results,
      },
    };
  },
};

module.exports = searchTool;
