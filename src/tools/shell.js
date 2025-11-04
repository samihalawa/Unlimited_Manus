const { spawn } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { resolveWorkspaceDir, restrictFilepath } = require('@src/runtime/runtime.util');

const sessions = new Map();

const resolveWorkingDirectory = async (cwd, userId) => {
  const workspaceDir = await resolveWorkspaceDir(userId);
  if (!cwd) {
    return workspaceDir;
  }
  const absolutePath = path.isAbsolute(cwd) ? cwd : path.join(workspaceDir, cwd);
  return restrictFilepath(absolutePath, userId);
};

const initialiseSession = (sessionId, cwd) => {
  const session = {
    id: sessionId,
    cwd,
    status: 'idle',
    process: null,
    history: [],
    waiters: [],
    lastStartedAt: null,
  };
  sessions.set(sessionId, session);
  return session;
};

const getSession = (sessionId) => {
  if (!sessionId) {
    throw new Error('session is required for this action.');
  }
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} does not exist. Start with the exec action.`);
  }
  return session;
};

const summariseOutput = (stdout, stderr, limit = 4000) => {
  const stdoutSnippet = stdout.length > limit ? `${stdout.slice(0, limit)}\n...` : stdout;
  const stderrSnippet = stderr.length > limit ? `${stderr.slice(0, limit)}\n...` : stderr;
  return { stdoutSnippet, stderrSnippet };
};

const flushWaiters = (session, payload) => {
  while (session.waiters.length) {
    const waiter = session.waiters.shift();
    try {
      waiter.resolve(payload);
    } catch (error) {
      // ignore waiter errors
    }
  }
};

const startCommand = async (params = {}, uuid, context = {}) => {
  const { command, timeout = 0, session: requestedSessionId, cwd } = params;
  if (!command || typeof command !== 'string') {
    throw new Error('command must be a non-empty string.');
  }

  const userId = context.user_id;
  const executionDir = await resolveWorkingDirectory(cwd, userId);
  const sessionId = requestedSessionId || uuidv4();
  const session = sessions.get(sessionId) || initialiseSession(sessionId, executionDir);

  if (session.process) {
    const lastHistory = session.history.length ? session.history[session.history.length - 1] : null;
    const runningCommand = lastHistory ? lastHistory.command : 'a previous command';
    throw new Error(`Session ${sessionId} is busy running "${runningCommand}". Use wait or kill before starting a new command.`);
  }

  const child = spawn(command, {
    cwd: executionDir,
    env: process.env,
    shell: true,
  });

  session.process = child;
  session.status = 'running';
  session.cwd = executionDir;
  session.lastStartedAt = new Date().toISOString();

  const entry = {
    command,
    start_time: session.lastStartedAt,
    stdout: '',
    stderr: '',
    exit_code: null,
    timed_out: false,
    duration_ms: null,
  };

  child.stdout.on('data', (chunk) => {
    entry.stdout += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    entry.stderr += chunk.toString();
  });

  const completed = new Promise((resolve, reject) => {
    child.on('error', (error) => {
      entry.stderr += error.message || '';
      entry.exit_code = -1;
      entry.duration_ms = Date.now() - new Date(entry.start_time).getTime();
      session.history.push(entry);
      session.status = 'idle';
      session.process = null;
      flushWaiters(session, entry);
      reject(error);
    });

    child.on('close', (code) => {
      entry.exit_code = code;
      entry.duration_ms = Date.now() - new Date(entry.start_time).getTime();
      session.history.push(entry);
      session.status = 'idle';
      session.process = null;
      flushWaiters(session, entry);
      resolve(entry);
    });
  });

  let timer = null;
  if (timeout && Number.isInteger(timeout) && timeout > 0) {
    timer = setTimeout(() => {
      if (session.process) {
        entry.timed_out = true;
        try {
          session.process.kill('SIGTERM');
        } catch (error) {
          // ignore kill errors
        }
      }
    }, timeout * 1000);
  }

  try {
    const result = await completed;
    return { sessionId, entry: result };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const waitForSession = async (session, timeout) => {
  if (!session.process) {
    return session.history.length ? session.history[session.history.length - 1] : null;
  }

  return new Promise((resolve, reject) => {
    const waiter = { resolve, reject };
    session.waiters.push(waiter);

    if (timeout && Number.isInteger(timeout) && timeout > 0) {
      setTimeout(() => {
        const index = session.waiters.indexOf(waiter);
        if (index !== -1) {
          session.waiters.splice(index, 1);
        }
        reject(new Error(`Timed out waiting for session ${session.id}`));
      }, timeout * 1000);
    }
  });
};

const killSession = async (session) => {
  if (session.process) {
    try {
      session.process.kill('SIGTERM');
    } catch (error) {
      throw new Error(`Failed to terminate session ${session.id}: ${error.message}`);
    }
  } else {
    throw new Error(`Session ${session.id} has no running process to kill.`);
  }
};

const sendInput = async (session, input) => {
  if (!session.process || !session.process.stdin.writable) {
    throw new Error(`Session ${session.id} is not attached to a writable process.`);
  }
  session.process.stdin.write(`${input.endsWith('\n') ? input : `${input}\n`}`);
};

const shellTool = {
  name: 'shell',
  description: 'Interact with shell sessions: execute commands, stream output, provide input, and manage running processes.',
  params: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['view', 'exec', 'wait', 'send', 'kill'],
        description: 'Shell session operation to perform.',
      },
      brief: {
        type: 'string',
        description: 'Optional description of the shell interaction (unused by backend but helpful for context).',
      },
      session: {
        type: 'string',
        description: 'Session identifier. Reuse to continue interacting with the same shell.',
      },
      command: {
        type: 'string',
        description: 'Command to execute (required for exec).',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the command (relative paths are resolved within the workspace).',
      },
      timeout: {
        type: 'integer',
        description: 'Timeout in seconds for exec or wait operations.',
      },
      input: {
        type: 'string',
        description: 'Input to send to the running process (used with send action).',
      },
    },
    required: ['action'],
  },
  getActionDescription: async ({ action, command }) => {
    switch (action) {
      case 'exec':
        return `Executing shell command: ${command || ''}`.trim();
      case 'view':
        return 'Viewing shell session state';
      case 'wait':
        return 'Waiting for shell command to finish';
      case 'send':
        return 'Sending input to shell session';
      case 'kill':
        return 'Terminating shell session';
      default:
        return 'Shell interaction';
    }
  },
  execute: async (params = {}, uuid, context = {}) => {
    const { action } = params;
    if (!action) {
      throw new Error('action is required for shell tool.');
    }

    if (action === 'exec') {
      const { sessionId, entry } = await startCommand(params, uuid, context);
      const { stdoutSnippet, stderrSnippet } = summariseOutput(entry.stdout, entry.stderr);
      const summary = [
        `Command: ${entry.command}`,
        `Exit code: ${entry.exit_code}`,
        entry.timed_out ? 'Result: Timed out' : 'Result: Completed',
      ].join('\n');
      const detail = [
        summary,
        stdoutSnippet ? `\nstdout:\n${stdoutSnippet}` : '',
        stderrSnippet ? `\nstderr:\n${stderrSnippet}` : '',
      ].join('');
      return {
        content: detail.trim(),
        meta: {
          json: [{
            session: sessionId,
            exit_code: entry.exit_code,
            timed_out: entry.timed_out,
            command: entry.command,
          }],
        },
      };
    }

    if (action === 'view') {
      const session = getSession(params.session);
      if (!session.history.length) {
        return {
          content: `Session ${session.id} is ${session.status} with no command history.`,
          meta: { json: [{ session: session.id, status: session.status }] },
        };
      }
      const lastEntry = session.history[session.history.length - 1];
      const { stdoutSnippet, stderrSnippet } = summariseOutput(lastEntry.stdout, lastEntry.stderr);
      const detail = [
        `Session ${session.id} (${session.status}). Last command "${lastEntry.command}" exited with ${lastEntry.exit_code}.`,
        stdoutSnippet ? `\nstdout:\n${stdoutSnippet}` : '',
        stderrSnippet ? `\nstderr:\n${stderrSnippet}` : '',
      ].join('');
      return {
        content: detail.trim(),
        meta: {
          json: [{
            session: session.id,
            history: session.history.map(item => ({
              command: item.command,
              exit_code: item.exit_code,
              timed_out: item.timed_out,
              start_time: item.start_time,
              duration_ms: item.duration_ms,
            })),
            status: session.status,
          }],
        },
      };
    }

    if (action === 'wait') {
      const session = getSession(params.session);
      const result = await waitForSession(session, params.timeout);
      if (!result) {
        return {
          content: `Session ${session.id} is idle.`,
          meta: { json: [{ session: session.id, status: session.status }] },
        };
      }
      const { stdoutSnippet, stderrSnippet } = summariseOutput(result.stdout, result.stderr);
      const detail = [
        `Session ${session.id} command "${result.command}" completed with ${result.exit_code}.`,
        stdoutSnippet ? `\nstdout:\n${stdoutSnippet}` : '',
        stderrSnippet ? `\nstderr:\n${stderrSnippet}` : '',
      ].join('');
      return {
        content: detail.trim(),
        meta: {
          json: [{
            session: session.id,
            exit_code: result.exit_code,
            timed_out: result.timed_out,
            command: result.command,
          }],
        },
      };
    }

    if (action === 'send') {
      const session = getSession(params.session);
      if (!params.input || typeof params.input !== 'string') {
        throw new Error('input is required when using send action.');
      }
      await sendInput(session, params.input);
      return {
        content: `Sent input to session ${session.id}.`,
        meta: { json: [{ session: session.id, input: params.input }] },
      };
    }

    if (action === 'kill') {
      const session = getSession(params.session);
      await killSession(session);
      return {
        content: `Terminated running command in session ${session.id}.`,
        meta: { json: [{ session: session.id, status: 'terminated' }] },
      };
    }

    throw new Error(`Unsupported shell action: ${action}`);
  },
};

module.exports = shellTool;
