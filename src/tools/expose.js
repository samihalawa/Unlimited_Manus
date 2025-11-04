const { v4: uuidv4 } = require('uuid');

let localtunnel = null;
try {
  // eslint-disable-next-line global-require
  localtunnel = require('localtunnel');
} catch (error) {
  localtunnel = null;
}

const activeTunnels = new Map();
let exitHookRegistered = false;

const registerExitHook = () => {
  if (exitHookRegistered) {
    return;
  }
  exitHookRegistered = true;
  process.on('exit', () => {
    for (const tunnel of activeTunnels.values()) {
      try {
        tunnel.close();
      } catch (error) {
        // ignore shutdown errors
      }
    }
  });
};

const exposeTool = {
  name: 'expose',
  description: 'Expose a local service by binding the provided port to a temporary public URL.',
  params: {
    type: 'object',
    properties: {
      port: {
        type: 'integer',
        description: 'Local port to expose.',
      },
      brief: {
        type: 'string',
        description: 'Optional note about the exposure (unused by backend).',
      },
    },
    required: ['port'],
  },
  getActionDescription: async ({ port }) => {
    return `Exposing local port ${port}`;
  },
  execute: async (params = {}) => {
    const { port } = params;
    if (typeof port !== 'number' || Number.isNaN(port) || port <= 0) {
      throw new Error('port must be a positive integer.');
    }

    if (!localtunnel) {
      return {
        content: `Unable to expose port ${port}: localtunnel dependency is not installed. Install it with "pnpm add localtunnel" and restart the service.`,
        meta: {
          json: [],
        },
      };
    }

    if (activeTunnels.has(port)) {
      const existing = activeTunnels.get(port);
      return {
        content: `Port ${port} is already exposed at ${existing.url}.`,
        meta: {
          json: [{ port, url: existing.url }],
        },
      };
    }

    const tunnel = await localtunnel({ port, allow_invalid_cert: true });
    const tunnelId = uuidv4();
    const payload = { port, url: tunnel.url, id: tunnelId };
    activeTunnels.set(port, { ...payload, close: tunnel.close.bind(tunnel) });
    registerExitHook();
    tunnel.on('close', () => {
      activeTunnels.delete(port);
    });

    return {
      content: `Port ${port} exposed at ${tunnel.url}`,
      meta: {
        json: [payload],
      },
    };
  },
};

module.exports = exposeTool;
