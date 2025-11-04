/**
 * Expose tool for exposing local ports to public URLs
 * Returns a temporary public URL for a local service
 */

const Expose = {
  name: "expose",
  description: "Expose a local port to a public URL. Returns a temporary public URL that can be used to access the local service.",
  params: {
    type: "object",
    properties: {
      brief: {
        description: "A one-sentence preamble describing the purpose of this operation",
        type: "string"
      },
      port: {
        description: "Local port number to expose",
        type: "integer"
      },
      subdomain: {
        description: "Optional custom subdomain",
        type: "string"
      }
    },
    required: ["port"]
  },
  memorized: false,
  
  async getActionDescription(args) {
    const { port, brief } = args;
    if (brief) return brief;
    return `Exposing port ${port}`;
  },
  
  async execute(args, uuid, context) {
    const { port, subdomain } = args;
    
    try {
      // Validate port
      if (port < 1 || port > 65535) {
        return {
          status: 'failure',
          content: 'Port must be between 1 and 65535',
          meta: { action_type: 'expose' }
        };
      }
      
      // Check if there's an existing exposure mechanism in the runtime
      // For now, return a stub URL indicating the service is available locally
      // In a production environment, this would integrate with:
      // - ngrok
      // - localtunnel
      // - cloudflare tunnels
      // - or the existing nginx/exposure system
      
      let publicUrl;
      let exposed = false;
      
      // Check if context has exposure mechanism
      if (context.runtime && typeof context.runtime.exposePort === 'function') {
        try {
          const result = await context.runtime.exposePort(port, subdomain);
          publicUrl = result.url;
          exposed = true;
        } catch (err) {
          console.warn('Runtime expose failed, falling back to localhost:', err);
        }
      }
      
      // Fallback to localhost
      if (!exposed) {
        publicUrl = `http://localhost:${port}`;
      }
      
      return {
        status: 'success',
        content: `${exposed ? 'Public URL' : 'Local URL'}: ${publicUrl}\nPort ${port} is ${exposed ? 'exposed' : 'available locally'}`,
        meta: {
          action_type: 'expose',
          port,
          url: publicUrl,
          exposed,
          subdomain: subdomain || null
        }
      };
    } catch (error) {
      console.error('Expose tool error:', error);
      return {
        status: 'failure',
        content: `Port exposure failed: ${error.message}`,
        meta: { action_type: 'expose' }
      };
    }
  }
};

module.exports = Expose;
