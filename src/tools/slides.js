const fs = require('fs').promises;
const path = require('path');
const { resolveWorkspaceDir, restrictFilepath } = require('@src/runtime/runtime.util');

const resolveContentPath = async (filePath, userId) => {
  if (!filePath) return null;
  const workspaceDir = await resolveWorkspaceDir(userId);
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.join(workspaceDir, filePath);
  return restrictFilepath(absolute, userId);
};

const slidesTool = {
  name: 'slides',
  description: 'Enter slides mode to draft or adjust presentation content before export.',
  params: {
    type: 'object',
    properties: {
      brief: {
        type: 'string',
        description: 'Optional context describing the presentation purpose.',
      },
      slide_content_file_path: {
        type: 'string',
        description: 'Path to the markdown outline that will drive slide creation.',
      },
      slide_count: {
        type: 'number',
        description: 'Expected number of slides in the presentation.',
      },
    },
  },
  getActionDescription: async ({ brief }) => {
    return brief ? `Entering slides mode: ${brief}` : 'Entering slides mode';
  },
  execute: async (params = {}, _uuid, context = {}) => {
    const { brief, slide_content_file_path, slide_count } = params;
    const userId = context.user_id;

    let contentPath = null;
    let outlinePreview = '';
    if (slide_content_file_path) {
      contentPath = await resolveContentPath(slide_content_file_path, userId);
      try {
        outlinePreview = await fs.readFile(contentPath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to read slide content file: ${error.message}`);
      }
    }

    context.active_modes = context.active_modes || new Set();
    context.active_modes.add('slides');

    const summary = [
      'Slides mode enabled.',
      brief ? `Brief: ${brief}` : null,
      typeof slide_count === 'number' ? `Target slides: ${slide_count}` : null,
      contentPath ? `Using outline at ${slide_content_file_path}.` : null,
    ].filter(Boolean).join(' ');

    return {
      content: summary,
      meta: {
        action_type: 'slides',
        json: [{
          mode: 'slides',
          slide_count: slide_count || null,
          outline_path: slide_content_file_path || null,
        }],
        content: outlinePreview || '',
        slide_count: slide_count || null,
        outline_path: slide_content_file_path || null,
      },
    };
  },
};

module.exports = slidesTool;
