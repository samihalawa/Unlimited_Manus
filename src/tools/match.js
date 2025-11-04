const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const GLOB_SPECIAL_CHARS = /[*?[\]{}()!+@]/;

const escapeRegExp = (value) => value.replace(/[.+^${}()|[\]\\]/g, '\\$&');

const globToRegExp = (glob) => {
  let regex = '';
  let i = 0;
  while (i < glob.length) {
    const char = glob[i];
    if (char === '*') {
      if (glob[i + 1] === '*') {
        regex += '.*';
        i += 2;
      } else {
        regex += '[^/]*';
        i += 1;
      }
    } else if (char === '?') {
      regex += '.';
      i += 1;
    } else if (char === '[') {
      const end = glob.indexOf(']', i);
      if (end === -1) {
        regex += '\\[';
        i += 1;
      } else {
        const content = glob.slice(i, end + 1);
        regex += content;
        i = end + 1;
      }
    } else {
      regex += escapeRegExp(char);
      i += 1;
    }
  }
  return new RegExp(`^${regex}$`);
};

const resolveScopeRoot = (scope) => {
  if (!scope) {
    throw new Error('scope is required.');
  }
  const parts = scope.split(path.sep);
  const stableParts = [];
  for (const part of parts) {
    if (GLOB_SPECIAL_CHARS.test(part)) {
      break;
    }
    stableParts.push(part);
  }
  if (!stableParts.length) {
    return path.sep;
  }
  let prefix = stableParts.join(path.sep);
  if (!prefix.startsWith(path.sep)) {
    prefix = `${path.sep}${prefix}`;
  }
  return prefix;
};

const walkDirectory = async (dir, collector) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(fullPath, collector);
    } else if (entry.isFile()) {
      collector(fullPath);
    }
  }
};

const findFilesInScope = async (scopePattern) => {
  const root = resolveScopeRoot(scopePattern);
  const regex = globToRegExp(scopePattern);
  const matches = [];
  try {
    await walkDirectory(root, (filePath) => {
      if (regex.test(filePath)) {
        matches.push(filePath);
      }
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  return matches;
};

const performGlob = async (scopePattern) => {
  const matches = await findFilesInScope(scopePattern);
  return matches.sort();
};

const performGrep = async (scopePattern, regexPattern, leading = 0, trailing = 0) => {
  const files = await findFilesInScope(scopePattern);
  const regex = new RegExp(regexPattern);
  const results = [];

  for (const file of files) {
    let content;
    try {
      content = await fs.readFile(file, 'utf8');
    } catch (error) {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        const startContext = Math.max(index - leading, 0);
        const endContext = Math.min(index + trailing + 1, lines.length);
        results.push({
          file,
          line: index + 1,
          match: line,
          leading_context: leading > 0 ? lines.slice(startContext, index) : [],
          trailing_context: trailing > 0 ? lines.slice(index + 1, endContext) : [],
        });
      }
    });
  }

  return results;
};

const matchTool = {
  name: 'match',
  description: 'Find files or text in the workspace using glob-style path matching or regex content search.',
  params: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['glob', 'grep'],
        description: 'Choose "glob" for file matching and "grep" for content searching.',
      },
      scope: {
        type: 'string',
        description: 'Absolute glob pattern restricting the search range (e.g., /workspace/**/*.ts).',
      },
      regex: {
        type: 'string',
        description: 'Regular expression for content search (required for grep).',
      },
      brief: {
        type: 'string',
        description: 'Optional description for the search (unused by backend).',
      },
      leading: {
        type: 'integer',
        description: 'Number of context lines to include before each match (grep only).',
      },
      trailing: {
        type: 'integer',
        description: 'Number of context lines to include after each match (grep only).',
      },
    },
    required: ['action', 'scope'],
  },
  getActionDescription: async ({ action, scope }) => {
    if (action === 'glob') {
      return `Finding files matching ${scope}`;
    }
    if (action === 'grep') {
      return `Searching inside files within ${scope}`;
    }
    return 'Pattern matching in workspace';
  },
  execute: async (params = {}, uuid = uuidv4()) => {
    const { action, scope, regex, leading = 0, trailing = 0 } = params;
    if (action === 'glob') {
      const matches = await performGlob(scope);
      const summary = matches.length
        ? `Found ${matches.length} file(s) matching pattern.`
        : 'No files matched the provided pattern.';
      return {
        content: `${summary}`,
        meta: {
          action_type: 'match.glob',
          scope,
          results: matches,
          json: matches.map(match => ({ path: match })),
        },
      };
    }

    if (action === 'grep') {
      if (!regex) {
        throw new Error('regex pattern is required when using grep.');
      }
      const results = await performGrep(scope, regex, leading, trailing);
      if (!results.length) {
        return {
          content: 'No matches found for the provided pattern.',
          meta: {
            action_type: 'match.grep',
            scope,
            regex,
            leading,
            trailing,
            results: [],
            json: [],
          },
        };
      }
      const contentLines = results.map(
        result => `${result.file}:${result.line}: ${result.match}`
      );
      return {
        content: contentLines.join('\n'),
        meta: {
          action_type: 'match.grep',
          scope,
          regex,
          leading,
          trailing,
          results,
          json: results,
        },
      };
    }

    throw new Error(`Unsupported match action: ${action}`);
  },
};

module.exports = matchTool;
