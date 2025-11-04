/**
 * File tool for file operations matching Manus reference guide
 * Actions: view (for images/PDFs, returns meta), read (text files), 
 *          write (create/overwrite), append (add to end), edit (targeted edits)
 */

const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

// Binary file extensions that should not be read as text
const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
]);

const File = {
  name: "file",
  description: "Perform operations on files in the sandbox file system. Actions: 'view' for multimodal files (images, PDFs), 'read' for text files, 'write' to create/overwrite, 'append' to add content, 'edit' for targeted changes.",
  params: {
    type: "object",
    properties: {
      action: {
        description: "The action to perform",
        type: "string",
        enum: ["view", "read", "write", "append", "edit"]
      },
      brief: {
        description: "A one-sentence preamble describing the purpose of this operation",
        type: "string"
      },
      edits: {
        description: "A list of edits to be sequentially applied to the file. Required for 'edit' action.",
        type: "array",
        items: {
          type: "object",
          properties: {
            all: {
              type: "boolean",
              description: "Whether to replace all occurrences"
            },
            find: {
              type: "string",
              description: "Text to find"
            },
            replace: {
              type: "string",
              description: "Replacement text"
            }
          },
          required: ["find", "replace"]
        }
      },
      path: {
        description: "The absolute path to the target file",
        type: "string"
      },
      range: {
        description: "An array of two integers specifying the start and end of the range. Numbers are 1-indexed, and -1 for the end means read to the end of the file. Optional and only used for 'view' and 'read' actions.",
        type: "array",
        items: {
          type: "integer"
        }
      },
      text: {
        description: "The content to be written or appended. Required for 'write' and 'append' actions.",
        type: "string"
      }
    },
    required: ["action", "path"]
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { action, path: filepath, brief } = args;
    if (brief) return brief;
    return `${action} ${filepath}`;
  },
  
  async execute(args, uuid, context) {
    const { action, path: filepath, text, range, edits } = args;
    
    try {
      // Resolve path relative to workspace if needed
      let fullPath = filepath;
      if (!path.isAbsolute(filepath) && context.workspace_dir) {
        fullPath = path.join(context.workspace_dir, filepath);
      }
      
      if (action === 'view') {
        // View action for images, PDFs, etc.
        if (!existsSync(fullPath)) {
          return {
            status: 'failure',
            content: `File not found: ${filepath}`,
            meta: { action_type: 'file', file_action: 'view' }
          };
        }
        
        const ext = path.extname(fullPath).toLowerCase();
        const stats = await fs.stat(fullPath);
        
        // Get mime type based on extension
        let mime = 'application/octet-stream';
        if (['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(ext)) {
          mime = `image/${ext.substring(1)}`;
        } else if (ext === '.pdf') {
          mime = 'application/pdf';
        } else if (['.txt', '.md', '.js', '.json', '.html', '.css'].includes(ext)) {
          mime = 'text/plain';
        }
        
        // For range parameter in view action
        let content = `File: ${filepath}\nType: ${mime}\nSize: ${stats.size} bytes`;
        if (range && Array.isArray(range) && range.length === 2) {
          // For PDF or image, range might indicate pages
          content += `\nRange: ${range[0]} to ${range[1] === -1 ? 'end' : range[1]}`;
        }
        
        return {
          status: 'success',
          content,
          meta: {
            action_type: 'file',
            file_action: 'view',
            filepath: fullPath,
            mime,
            size: stats.size,
            extension: ext
          }
        };
        
      } else if (action === 'read') {
        // Read text file
        const ext = path.extname(fullPath).toLowerCase();
        
        // Check if binary
        if (BINARY_EXTENSIONS.has(ext)) {
          return {
            status: 'failure',
            content: `Cannot read binary file: ${filepath}. Use 'view' action for binary files.`,
            meta: { action_type: 'file', file_action: 'read' }
          };
        }
        
        if (!existsSync(fullPath)) {
          return {
            status: 'failure',
            content: `File not found: ${filepath}`,
            meta: { action_type: 'file', file_action: 'read' }
          };
        }
        
        let fileContent = await fs.readFile(fullPath, 'utf-8');
        
        // Apply range if specified
        if (range && Array.isArray(range) && range.length === 2) {
          const lines = fileContent.split('\n');
          const start = Math.max(0, range[0] - 1); // 1-indexed to 0-indexed
          const end = range[1] === -1 ? lines.length : range[1];
          fileContent = lines.slice(start, end).join('\n');
        }
        
        return {
          status: 'success',
          content: fileContent,
          meta: {
            action_type: 'file',
            file_action: 'read',
            filepath: fullPath,
            lines: fileContent.split('\n').length
          }
        };
        
      } else if (action === 'write') {
        // Write/create file
        if (text === undefined) {
          return {
            status: 'failure',
            content: 'text is required for write action',
            meta: { action_type: 'file', file_action: 'write' }
          };
        }
        
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        
        await fs.writeFile(fullPath, text, 'utf-8');
        
        return {
          status: 'success',
          content: `File written: ${filepath} (${text.length} characters)`,
          meta: {
            action_type: 'file',
            file_action: 'write',
            filepath: fullPath,
            size: text.length
          }
        };
        
      } else if (action === 'append') {
        // Append to file
        if (text === undefined) {
          return {
            status: 'failure',
            content: 'text is required for append action',
            meta: { action_type: 'file', file_action: 'append' }
          };
        }
        
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        
        await fs.appendFile(fullPath, text, 'utf-8');
        
        return {
          status: 'success',
          content: `Content appended to: ${filepath}`,
          meta: {
            action_type: 'file',
            file_action: 'append',
            filepath: fullPath
          }
        };
        
      } else if (action === 'edit') {
        // Edit (find and replace with edits array)
        if (!edits || !Array.isArray(edits) || edits.length === 0) {
          return {
            status: 'failure',
            content: 'edits array is required for edit action',
            meta: { action_type: 'file', file_action: 'edit' }
          };
        }
        
        if (!existsSync(fullPath)) {
          return {
            status: 'failure',
            content: `File not found: ${filepath}`,
            meta: { action_type: 'file', file_action: 'edit' }
          };
        }
        
        let fileContent = await fs.readFile(fullPath, 'utf-8');
        let appliedEdits = 0;
        
        // Apply each edit sequentially
        for (const edit of edits) {
          if (!edit.find || edit.replace === undefined) {
            continue;
          }
          
          if (edit.all) {
            // Replace all occurrences
            const regex = new RegExp(escapeRegExp(edit.find), 'g');
            fileContent = fileContent.replace(regex, edit.replace);
            appliedEdits++;
          } else {
            // Replace first occurrence
            if (fileContent.includes(edit.find)) {
              fileContent = fileContent.replace(edit.find, edit.replace);
              appliedEdits++;
            }
          }
        }
        
        await fs.writeFile(fullPath, fileContent, 'utf-8');
        
        return {
          status: 'success',
          content: `File edited: ${filepath} (${appliedEdits} edits applied)`,
          meta: {
            action_type: 'file',
            file_action: 'edit',
            filepath: fullPath,
            edits_applied: appliedEdits
          }
        };
        
      } else {
        return {
          status: 'failure',
          content: `Unknown action: ${action}`,
          meta: { action_type: 'file' }
        };
      }
    } catch (error) {
      console.error('File tool error:', error);
      return {
        status: 'failure',
        content: `File operation failed: ${error.message}`,
        meta: { action_type: 'file', file_action: action }
      };
    }
  }
};

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = File;
