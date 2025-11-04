/**
 * Match tool for pattern matching in files
 * Actions: glob (file pattern matching), grep (content search with regex)
 */

const { glob } = require('glob');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

const Match = {
  name: "match",
  description: "Find files or text in the sandbox file system using pattern matching. Actions: 'glob' to match file paths/names, 'grep' to search contents with regex.",
  params: {
    type: "object",
    properties: {
      action: {
        description: "The action to perform",
        type: "string",
        enum: ["glob", "grep"]
      },
      brief: {
        description: "A one-sentence preamble describing the purpose of this operation",
        type: "string"
      },
      leading: {
        description: "Number of lines to include before each match as context. Optional and only used for 'grep' action. Defaults to 0.",
        type: "integer"
      },
      regex: {
        description: "The regex pattern to match file content. Required for 'grep' action.",
        type: "string"
      },
      scope: {
        description: "The glob pattern that defines the absolute file path and name scope",
        type: "string"
      },
      trailing: {
        description: "Number of lines to include after each match as context. Optional and only used for 'grep' action. Defaults to 0.",
        type: "integer"
      }
    },
    required: ["action"]
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { action, regex, scope, brief } = args;
    if (brief) return brief;
    return `${action}: ${regex || scope || 'pattern'}`;
  },
  
  async execute(args, uuid, context) {
    const { 
      action, 
      regex, 
      scope, 
      leading = 0,
      trailing = 0
    } = args;
    
    try {
      const workspaceDir = context.workspace_dir || process.cwd();
      
      if (action === 'glob') {
        // File pattern matching
        if (!scope) {
          return {
            status: 'failure',
            content: 'scope is required for glob action',
            meta: { action_type: 'match', match_action: 'glob' }
          };
        }
        
        const options = {
          cwd: workspaceDir,
          ignore: ['node_modules/**', '.git/**', '**/node_modules/**'],
          nodir: false,
          absolute: false
        };
        
        const matches = await glob(scope, options);
        
        if (matches.length === 0) {
          return {
            status: 'success',
            content: `No files found matching: ${scope}`,
            meta: {
              action_type: 'match',
              match_action: 'glob',
              pattern: scope,
              results: []
            }
          };
        }
        
        return {
          status: 'success',
          content: `Found ${matches.length} file(s):\n${matches.slice(0, 50).join('\n')}${matches.length > 50 ? `\n... and ${matches.length - 50} more` : ''}`,
          meta: {
            action_type: 'match',
            match_action: 'glob',
            pattern: scope,
            results: matches,
            count: matches.length
          }
        };
        
      } else if (action === 'grep') {
        // Content search with regex
        if (!scope || !regex) {
          return {
            status: 'failure',
            content: 'scope and regex are required for grep action',
            meta: { action_type: 'match', match_action: 'grep' }
          };
        }
        
        // Get files to search
        const files = await glob(scope, {
          cwd: workspaceDir,
          ignore: ['node_modules/**', '.git/**', '**/node_modules/**'],
          nodir: true
        });
        
        if (files.length === 0) {
          return {
            status: 'success',
            content: `No files found matching scope: ${scope}`,
            meta: {
              action_type: 'match',
              match_action: 'grep',
              pattern,
              scope,
              results: []
            }
          };
        }
        
        // Create regex (case sensitive by default per spec)
        let regexObj;
        try {
          regexObj = new RegExp(regex, 'g');
        } catch (e) {
          return {
            status: 'failure',
            content: `Invalid regex pattern: ${regex}`,
            meta: { action_type: 'match', match_action: 'grep' }
          };
        }
        
        // Search files
        const results = [];
        for (const file of files.slice(0, 100)) { // Limit to 100 files
          const fullPath = path.join(workspaceDir, file);
          
          if (!existsSync(fullPath)) continue;
          
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            
            const matches = [];
            lines.forEach((line, lineNum) => {
              if (regexObj.test(line)) {
                const startLine = Math.max(0, lineNum - leading);
                const endLine = Math.min(lines.length - 1, lineNum + trailing);
                
                const contextLines = [];
                for (let i = startLine; i <= endLine; i++) {
                  contextLines.push({
                    line_number: i + 1,
                    content: lines[i],
                    is_match: i === lineNum
                  });
                }
                
                matches.push({
                  line_number: lineNum + 1,
                  line: line,
                  context: contextLines
                });
              }
              // Reset regex lastIndex for global flag
              regexObj.lastIndex = 0;
            });
            
            if (matches.length > 0) {
              results.push({
                file,
                matches
              });
            }
          } catch (err) {
            // Skip files that can't be read
            console.warn(`Could not read ${file}:`, err.message);
          }
        }
        
        if (results.length === 0) {
          return {
            status: 'success',
            content: `No matches found for pattern: ${regex}`,
            meta: {
              action_type: 'match',
              match_action: 'grep',
              regex,
              scope,
              results: []
            }
          };
        }
        
        // Format output
        let output = `Found ${results.length} file(s) with matches:\n\n`;
        for (const result of results.slice(0, 10)) {
          output += `${result.file}:\n`;
          for (const match of result.matches.slice(0, 3)) {
            output += `  Line ${match.line_number}: ${match.line.substring(0, 100)}\n`;
          }
          if (result.matches.length > 3) {
            output += `  ... and ${result.matches.length - 3} more matches\n`;
          }
          output += '\n';
        }
        if (results.length > 10) {
          output += `... and ${results.length - 10} more files\n`;
        }
        
        return {
          status: 'success',
          content: output,
          meta: {
            action_type: 'match',
            match_action: 'grep',
            regex,
            scope,
            results,
            total_files: results.length,
            total_matches: results.reduce((sum, r) => sum + r.matches.length, 0)
          }
        };
        
      } else {
        return {
          status: 'failure',
          content: `Unknown action: ${action}`,
          meta: { action_type: 'match' }
        };
      }
    } catch (error) {
      console.error('Match tool error:', error);
      return {
        status: 'failure',
        content: `Match operation failed: ${error.message}`,
        meta: { action_type: 'match', match_action: action }
      };
    }
  }
};

module.exports = Match;
