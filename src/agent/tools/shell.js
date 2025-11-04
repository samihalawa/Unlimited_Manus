/**
 * Shell tool for terminal/shell session management
 * Actions: view (list sessions), exec (execute command), wait (wait for completion), 
 *          send (send input to running process), kill (terminate session)
 */

const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Store active shell sessions
const sessions = new Map();

const buildShellMeta = (action, extra = {}) => ({
  action_type: `shell.${action}`,
  tool: "shell",
  shell_action: action,
  ...extra,
});

const Shell = {
  name: "shell",
  description: "Interact with shell sessions in the sandbox environment. Actions: 'view' to view session content, 'exec' to execute commands, 'wait' to wait for process completion, 'send' to send input to active process, 'kill' to terminate process.",
  params: {
    type: "object",
    properties: {
      action: {
        description: "The action to perform",
        type: "string",
        enum: ["view", "exec", "wait", "send", "kill"]
      },
      brief: {
        description: "A one-sentence preamble describing the purpose of this operation",
        type: "string"
      },
      command: {
        description: "The shell command to execute. Required for 'exec' action.",
        type: "string"
      },
      input: {
        description: "Input text to send to the interactive session. End with a newline character (\\n) to simulate pressing Enter if needed. Required for 'send' action.",
        type: "string"
      },
      session: {
        description: "The unique identifier of the target shell session",
        type: "string"
      },
      timeout: {
        description: "Timeout in seconds to wait for command execution. Optional and only used for 'exec' and 'wait' actions. Defaults to 30 seconds.",
        type: "integer"
      }
    },
    required: ["action"]
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { action, command, session, brief } = args;
    if (brief) return brief;
    if (action === 'exec' && command) {
      return `Executing: ${command}`;
    } else if (action === 'send' && args.input) {
      return `Sending input to session ${session}`;
    } else if (action === 'kill') {
      return `Terminating session ${session}`;
    }
    return `Shell ${action}`;
  },
  
  async execute(args, uuid, context) {
    const { action, session, command, timeout = 30, input } = args;
    
    try {
      if (action === 'view') {
        // List active sessions
        const sessionList = Array.from(sessions.entries()).map(([id, session]) => ({
          id,
          running: session.running,
          command: session.command,
          pid: session.process?.pid
        }));
        
        return {
          status: 'success',
          content: sessionList.length > 0 
            ? `Active sessions:\n${sessionList.map(s => `- ${s.id}: ${s.command} (${s.running ? 'running' : 'idle'})`).join('\n')}`
            : 'No active sessions',
          meta: buildShellMeta('view', { sessions: sessionList })
        };
        
      } else if (action === 'exec') {
        // Execute command
        if (!command) {
          return {
            status: 'failure',
            content: 'Command is required for exec action',
            meta: buildShellMeta('exec')
          };
        }
        
        const sid = session || `shell_${uuidv4().substring(0, 8)}`;
        const workingDir = context.workspace_dir || process.cwd();
        
        return new Promise((resolve) => {
          let stdout = '';
          let stderr = '';
          let completed = false;
          
          // Parse command
          const parts = command.trim().split(/\s+/);
          const cmd = parts[0];
          const cmdArgs = parts.slice(1);
          
          const proc = spawn(cmd, cmdArgs, {
            cwd: workingDir,
            shell: true,
            env: process.env
          });
          
          proc.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          
          proc.stderr?.on('data', (data) => {
            stderr += data.toString();
          });
          
          proc.on('close', (code) => {
            if (!completed) {
              completed = true;
              sessions.delete(sid);
              resolve({
                status: code === 0 ? 'success' : 'failure',
                content: stdout || stderr || `Command exited with code ${code}`,
                meta: buildShellMeta('exec', {
                  session_id: sid,
                  exit_code: code,
                  stdout,
                  stderr
                })
              });
            }
          });
          
          proc.on('error', (error) => {
            if (!completed) {
              completed = true;
              sessions.delete(sid);
              resolve({
                status: 'failure',
                content: `Command failed: ${error.message}`,
                meta: buildShellMeta('exec', { session_id: sid })
              });
            }
          });
          
          // Store session
          sessions.set(sid, {
            process: proc,
            command,
            running: true,
            stdout,
            stderr
          });
          
          // Set timeout
          const timeoutMs = timeout * 1000;
          setTimeout(() => {
            if (!completed) {
              completed = true;
              const session = sessions.get(sid);
              if (session) {
                session.running = false;
              }
              resolve({
                status: 'success',
                content: `Command still running after ${timeout}s. Use 'wait' or 'kill' to manage.\nOutput so far:\n${stdout}`,
                meta: buildShellMeta('exec', {
                  session_id: sid,
                  timeout: true,
                  stdout,
                  stderr
                })
              });
            }
          }, timeoutMs);
        });
        
      } else if (action === 'wait') {
        // Wait for session completion
        if (!session) {
          return {
            status: 'failure',
            content: 'session is required for wait action',
            meta: buildShellMeta('wait')
          };
        }
        
        const sessionData = sessions.get(session);
        if (!sessionData) {
          return {
            status: 'failure',
            content: `Session ${session} not found`,
            meta: buildShellMeta('wait')
          };
        }
        
        // Wait for process or timeout
        return new Promise((resolve) => {
          const proc = sessionData.process;
          let completed = false;
          
          const checkComplete = () => {
            if (!completed && !sessionData.running) {
              completed = true;
              resolve({
                status: 'success',
                content: sessionData.stdout || sessionData.stderr || 'Process completed',
                meta: buildShellMeta('wait', {
                  session_id: session,
                  stdout: sessionData.stdout,
                  stderr: sessionData.stderr
                })
              });
            }
          };
          
          proc.on('close', checkComplete);
          
          setTimeout(() => {
            if (!completed) {
              completed = true;
              resolve({
                status: 'success',
                content: `Still running. Output so far:\n${sessionData.stdout}`,
                meta: buildShellMeta('wait', {
                  session_id: session,
                  timeout: true
                })
              });
            }
          }, timeout * 1000);
        });
        
      } else if (action === 'send') {
        // Send input to session
        if (!session || !input) {
          return {
            status: 'failure',
            content: 'session and input are required for send action',
            meta: buildShellMeta('send')
          };
        }
        
        const sessionData = sessions.get(session);
        if (!sessionData || !sessionData.process) {
          return {
            status: 'failure',
            content: `Session ${session} not found or not active`,
            meta: buildShellMeta('send')
          };
        }
        
        // Send input (input should already contain \n if needed per spec)
        sessionData.process.stdin.write(input);
        
        return {
          status: 'success',
          content: `Sent input to session ${session}`,
          meta: buildShellMeta('send', { session_id: session })
        };
        
      } else if (action === 'kill') {
        // Kill session
        if (!session) {
          return {
            status: 'failure',
            content: 'session is required for kill action',
            meta: buildShellMeta('kill')
          };
        }
        
        const sessionData = sessions.get(session);
        if (!sessionData) {
          return {
            status: 'failure',
            content: `Session ${session} not found`,
            meta: buildShellMeta('kill')
          };
        }
        
        if (sessionData.process) {
          sessionData.process.kill();
        }
        sessions.delete(session);
        
        return {
          status: 'success',
          content: `Session ${session} terminated`,
          meta: buildShellMeta('kill', { session_id: session })
        };
        
      } else {
        return {
          status: 'failure',
          content: `Unknown action: ${action}`,
          meta: buildShellMeta(action || 'unknown')
        };
      }
    } catch (error) {
      console.error('Shell tool error:', error);
      return {
        status: 'failure',
        content: `Shell operation failed: ${error.message}`,
        meta: buildShellMeta('error')
      };
    }
  }
};

module.exports = Shell;
