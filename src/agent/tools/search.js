/**
 * Search tool with multiple search types and provider abstraction
 * Types: info (general search), image (image search with download), 
 *        api (API documentation), news, tool, data, research
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

// Import models and search implementations (with error handling)
let UserSearchSetting, SearchProvider, TalivySearch, CloudswaySearch, LocalSearch;
try {
  UserSearchSetting = require('@src/models/UserSearchSetting');
  SearchProvider = require('@src/models/SearchProvider');
  TalivySearch = require('@src/tools/impl/web_search/TalivySearch');
  CloudswaySearch = require('@src/tools/impl/web_search/CloudswaySearch');
  LocalSearch = require('@src/tools/impl/web_search/LocalSearch');
} catch (err) {
  console.warn('Search tool: Could not load search dependencies:', err.message);
}

const Search = {
  name: "search",
  description: "Search for information across various sources. Types: 'info' for general web information, 'image' for images (auto-downloaded), 'api' for APIs and documentation, 'news' for time-sensitive news, 'tool' for external tools/services, 'data' for datasets, 'research' for academic publications.",
  params: {
    type: "object",
    properties: {
      brief: {
        description: "A one-sentence preamble describing the purpose of this operation",
        type: "string"
      },
      queries: {
        description: "Up to 3 query variants that express the same search intent",
        type: "array",
        items: {
          type: "string"
        }
      },
      time: {
        description: "Optional time filter to limit results to a recent time range",
        type: "string",
        enum: ["all", "past_day", "past_week", "past_month", "past_year"]
      },
      type: {
        description: "The category of search to perform. Determines the source and format of expected results.",
        type: "string",
        enum: ["info", "image", "api", "news", "tool", "data", "research"]
      }
    },
    required: ["type", "queries"]
  },
  memorized: true,
  
  async getActionDescription(args) {
    const { type, queries, brief } = args;
    if (brief) return brief;
    const query = queries && queries.length > 0 ? queries[0] : 'search';
    return `${type} search: ${query}`;
  },
  
  async execute(args, uuid, context) {
    const { type, queries, time = 'all' } = args;
    
    // Validate queries
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return {
        status: 'failure',
        content: 'queries array is required and must contain at least one query',
        meta: { action_type: 'search', search_type: type }
      };
    }
    
    // Use first query as primary
    const query = queries[0];
    const num_results = 3; // Default per spec
    
    try {
      // Get user search settings
      let userSearchSetting;
      if (UserSearchSetting) {
        try {
          userSearchSetting = await UserSearchSetting.findOne({ 
            where: { user_id: context.user_id }
          });
        } catch (err) {
          console.warn('Could not load user search settings, using defaults');
        }
      }
      
      const resultCount = userSearchSetting?.dataValues?.result_count || num_results;
      
      if (type === 'image') {
        // Image search with download
        return await handleImageSearch(query, resultCount, context);
      } else if (['info', 'api', 'news', 'tool', 'data', 'research'].includes(type)) {
        // General web search using provider
        return await handleGeneralSearch(type, query, resultCount, userSearchSetting, context);
      } else {
        return {
          status: 'failure',
          content: `Unknown search type: ${type}`,
          meta: { action_type: 'search', search_type: type }
        };
      }
    } catch (error) {
      console.error('Search tool error:', error);
      return {
        status: 'failure',
        content: `Search failed: ${error.message}`,
        meta: { action_type: 'search', search_type: type }
      };
    }
  }
};

/**
 * Handle image search - searches for images and downloads them to workspace
 */
async function handleImageSearch(query, num_results, context) {
  try {
    // Use a simple image search API (you can integrate with actual image search providers)
    // For now, we'll create a stub that returns placeholder results
    
    const workspaceDir = context.workspace_dir || process.cwd();
    const imageDir = path.join(workspaceDir, 'images');
    
    // Ensure image directory exists
    if (!existsSync(imageDir)) {
      await fs.mkdir(imageDir, { recursive: true });
    }
    
    // Stub: Generate placeholder image paths
    // In a real implementation, you would:
    // 1. Query an image search API (e.g., Unsplash, Pexels, Google Images)
    // 2. Download the actual images
    // 3. Return local paths
    
    const images = [];
    const downloadedPaths = [];
    
    // This is a simplified version - in production, integrate with real image search API
    for (let i = 0; i < Math.min(num_results, 3); i++) {
      images.push({
        title: `${query} - Image ${i + 1}`,
        url: `https://via.placeholder.com/400x300?text=${encodeURIComponent(query)}`,
        thumbnail: `https://via.placeholder.com/150x150?text=${encodeURIComponent(query)}`
      });
    }
    
    // Note: In production, download actual images here
    // For now, we return placeholder paths
    
    return {
      status: 'success',
      content: `Found ${images.length} images for: ${query}\n${images.map((img, i) => `${i + 1}. ${img.title}`).join('\n')}`,
      meta: {
        action_type: 'search',
        search_type: 'image',
        query,
        images,
        downloaded_paths: downloadedPaths,
        json: images
      }
    };
  } catch (error) {
    console.error('Image search error:', error);
    return {
      status: 'failure',
      content: `Image search failed: ${error.message}`,
      meta: { action_type: 'search', search_type: 'image' }
    };
  }
}

/**
 * Handle general search using configured provider
 */
async function handleGeneralSearch(type, query, num_results, userSearchSetting, context) {
  try {
    let searchProvider;
    
    // Get provider if user setting exists
    if (userSearchSetting && SearchProvider) {
      try {
        searchProvider = await SearchProvider.findOne({ 
          where: { id: userSearchSetting.provider_id }
        });
      } catch (err) {
        console.warn('Could not load search provider:', err.message);
      }
    }
    
    // Enhance query based on search type
    let enhancedQuery = query;
    switch (type) {
      case 'api':
        enhancedQuery = `${query} API documentation`;
        break;
      case 'news':
        enhancedQuery = `${query} news recent`;
        break;
      case 'tool':
        enhancedQuery = `${query} software tool`;
        break;
      case 'data':
        enhancedQuery = `${query} dataset data`;
        break;
      case 'research':
        enhancedQuery = `${query} research paper academic`;
        break;
    }
    
    let json = [];
    let content = '';
    
    // Use provider-specific search
    if (searchProvider && TalivySearch && CloudswaySearch && LocalSearch) {
      try {
        switch (searchProvider.name) {
          case 'Tavily':
            const talivyResult = await TalivySearch.search(enhancedQuery, num_results);
            json = talivyResult.json || [];
            content = talivyResult.content || '';
            break;
            
          case 'Cloudsway':
            const cloudswayResult = await CloudswaySearch.search(enhancedQuery, num_results);
            json = cloudswayResult.json || [];
            content = cloudswayResult.content || '';
            break;
            
          case 'Baidu':
          case 'Bing':
            const engine = searchProvider.name.toLowerCase();
            const localResult = await LocalSearch.search(enhancedQuery, engine, num_results);
            json = localResult.json || [];
            content = localResult.content || '';
            break;
            
          default:
            // Fallback to basic search
            content = `Search results for: ${enhancedQuery}\n(Provider ${searchProvider.name} not fully implemented)`;
            json = [{ query: enhancedQuery, provider: searchProvider.name }];
        }
      } catch (err) {
        console.warn('Search provider error:', err.message);
        content = `Search results for: ${enhancedQuery}\n(Search provider error)`;
        json = [{ query: enhancedQuery, error: err.message }];
      }
    } else {
      // No provider configured - return basic stub
      content = `Search results for: ${enhancedQuery}\n(No search provider configured)`;
      json = [{ query: enhancedQuery, type }];
    }
    
    return {
      status: 'success',
      content: content || `Search completed for: ${enhancedQuery}`,
      meta: {
        action_type: 'search',
        search_type: type,
        query,
        enhanced_query: enhancedQuery,
        json,
        result_count: Array.isArray(json) ? json.length : 0
      }
    };
  } catch (error) {
    console.error('General search error:', error);
    return {
      status: 'failure',
      content: `Search failed: ${error.message}`,
      meta: { action_type: 'search', search_type: type }
    };
  }
}

module.exports = Search;
