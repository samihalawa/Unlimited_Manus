const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { resolveWorkspaceDir, restrictFilepath } = require('@src/runtime/runtime.util');

const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.csv': 'text/csv',
};

const resolveMimeType = (filepath) => {
  const extension = path.extname(filepath).toLowerCase();
  return MIME_MAP[extension] || 'application/octet-stream';
};

const ensureDirectory = async (filepath) => {
  const directory = path.dirname(filepath);
  await fs.mkdir(directory, { recursive: true });
};

const resolveTargetPath = async (targetPath, userId) => {
  if (!targetPath || typeof targetPath !== 'string') {
    throw new Error('path must be a valid string.');
  }
  const workspaceDir = await resolveWorkspaceDir(userId);
  const absolute = path.isAbsolute(targetPath)
    ? targetPath
    : path.join(workspaceDir, targetPath);
  return restrictFilepath(absolute, userId);
};

const readFileContent = async (filepath, range) => {
  const data = await fs.readFile(filepath, 'utf8');
  if (!Array.isArray(range) || range.length !== 2) {
    return data;
  }
  const [start, end] = range;
  const lines = data.split(/\r?\n/);
  const startIndex = Math.max((start || 1) - 1, 0);
  const endIndex = end === -1 ? lines.length : Math.min(end, lines.length);
  return lines.slice(startIndex, endIndex).join('\n');
};

const viewFileContent = async (filepath) => {
  const mimeType = resolveMimeType(filepath);
  const buffer = await fs.readFile(filepath);
  const base64 = buffer.toString('base64');
  return {
    mimeType,
    base64,
  };
};

const applyEdits = (content, edits = []) => {
  let updated = content;
  for (const edit of edits) {
    const { find, replace = '', all = false } = edit;
    if (typeof find !== 'string') {
      throw new Error('Each edit must provide a string "find" pattern.');
    }
    if (all) {
      updated = updated.split(find).join(replace);
    } else {
      updated = updated.replace(find, replace);
    }
  }
  return updated;
};

const fileTool = {
  name: 'file',
  description: 'Perform file operations inside the workspace, including viewing, reading, writing, appending, and targeted edits.',
  params: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['view', 'read', 'write', 'append', 'edit'],
        description: 'File operation to perform.',
      },
      path: {
        type: 'string',
        description: 'Absolute or workspace-relative path to the target file.',
      },
      range: {
        type: 'array',
        description: 'Optional [start, end] (1-indexed) line range for read/view actions.',
        items: { type: 'integer' },
      },
      text: {
        type: 'string',
        description: 'Content to write or append.',
      },
      edits: {
        type: 'array',
        description: 'List of edits for the edit action.',
        items: {
          type: 'object',
          properties: {
            find: { type: 'string' },
            replace: { type: 'string' },
            all: { type: 'boolean' },
          },
          required: ['find'],
        },
      },
    },
    required: ['action', 'path'],
  },
  getActionDescription: async ({ action, path: targetPath }) => {
    switch (action) {
      case 'view':
        return `Viewing file preview for ${targetPath}`;
      case 'read':
        return `Reading file ${targetPath}`;
      case 'write':
        return `Writing file ${targetPath}`;
      case 'append':
        return `Appending to file ${targetPath}`;
      case 'edit':
        return `Editing file ${targetPath}`;
      default:
        return `File operation on ${targetPath}`;
    }
  },
  execute: async (params = {}, uuid = uuidv4(), context = {}) => {
    const { action, path: targetPath, range, text, edits = [] } = params;
    const userId = context.user_id;
    const resolvedPath = await resolveTargetPath(targetPath, userId);

    if (action === 'view') {
      const { mimeType, base64 } = await viewFileContent(resolvedPath);
      const summary = `Viewed file ${targetPath} (${mimeType}). Content returned as base64.`;
      return {
        content: summary,
        meta: {
          filepath: resolvedPath,
          content: JSON.stringify({ mimeType, base64 }),
        },
      };
    }

    if (action === 'read') {
      const data = await readFileContent(resolvedPath, range);
      return {
        content: data,
        meta: {
          filepath: resolvedPath,
        },
      };
    }

    if (action === 'write') {
      if (typeof text !== 'string') {
        throw new Error('text is required when using write action.');
      }
      await ensureDirectory(resolvedPath);
      await fs.writeFile(resolvedPath, text, 'utf8');
      return {
        content: `Wrote ${text.length} characters to ${targetPath}.`,
        meta: {
          filepath: resolvedPath,
        },
      };
    }

    if (action === 'append') {
      if (typeof text !== 'string') {
        throw new Error('text is required when using append action.');
      }
      await ensureDirectory(resolvedPath);
      await fs.appendFile(resolvedPath, text, 'utf8');
      return {
        content: `Appended ${text.length} characters to ${targetPath}.`,
        meta: {
          filepath: resolvedPath,
        },
      };
    }

    if (action === 'edit') {
      if (!Array.isArray(edits) || edits.length === 0) {
        throw new Error('edits must be a non-empty array for edit action.');
      }
      const original = await fs.readFile(resolvedPath, 'utf8');
      const updated = applyEdits(original, edits);
      await fs.writeFile(resolvedPath, updated, 'utf8');
      return {
        content: `Applied ${edits.length} edit(s) to ${targetPath}.`,
        meta: {
          filepath: resolvedPath,
        },
      };
    }

    throw new Error(`Unsupported file action: ${action}`);
  },
};

module.exports = fileTool;
