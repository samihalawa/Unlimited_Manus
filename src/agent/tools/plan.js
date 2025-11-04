/**
 * Plan tool for phase-based task planning and execution tracking
 * Actions: update (create/update plan), advance (move to next phase)
 */

const Plan = {
  name: "plan",
  description: "Create, update, and advance the structured task plan. Use 'update' to create or revise the plan, 'advance' to move to the next phase when current phase is complete.",
  params: {
    type: "object",
    properties: {
      action: {
        description: "The action to perform",
        type: "string",
        enum: ["update", "advance"]
      },
      current_phase_id: {
        description: "ID of the phase the task is currently in. Must be one of the IDs in the latest phases list.",
        type: "integer"
      },
      goal: {
        description: "The overall goal of the task, written as a clear and concise sentence. Required for 'update' action.",
        type: "string"
      },
      next_phase_id: {
        description: "ID of the phase the task is advancing to. Must be one of the IDs in the latest phases list. Required for 'advance' action.",
        type: "integer"
      },
      phases: {
        description: "Complete list of phases required to achieve the task goal. Required for 'update' action.",
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Phase ID"
            },
            title: {
              type: "string",
              description: "Phase title"
            },
            capabilities: {
              type: "object",
              description: "Phase capabilities and requirements"
            }
          },
          required: ["id", "title"]
        }
      }
    },
    required: ["action"]
  },
  memorized: true,
  
  async getActionDescription(args) {
    if (args.action === 'update') {
      return `Updating plan: ${args.goal || 'Task plan'}`;
    } else if (args.action === 'advance') {
      return `Advancing to next phase`;
    }
    return 'Managing task plan';
  },
  
  async execute(args, uuid, context) {
    const { action, goal, phases, current_phase_id, next_phase_id } = args;
    
    try {
      if (action === 'update') {
        // Validate update action
        if (!goal || !phases || !Array.isArray(phases) || phases.length === 0) {
          return {
            status: 'failure',
            content: 'Plan update requires goal and phases array',
            meta: { action_type: 'plan', plan_action: 'update' }
          };
        }
        
        // Validate phases have required fields
        for (const phase of phases) {
          if (!phase.id || !phase.title) {
            return {
              status: 'failure',
              content: 'Each phase must have id and title',
              meta: { action_type: 'plan', plan_action: 'update' }
            };
          }
        }
        
        // Store plan in context
        const plan = {
          goal,
          phases: phases.map(p => ({
            id: p.id,
            title: p.title,
            capabilities: p.capabilities || {},
            status: p.id === 1 ? 'active' : 'pending'
          })),
          current_phase_id: current_phase_id || 1,
          createdAt: new Date().toISOString()
        };
        
        context.plan = plan;
        
        // Store in task manager if available
        if (context.task_manager) {
          await context.task_manager.updatePlan(plan);
        }
        
        return {
          status: 'success',
          content: `Plan created with ${phases.length} phases:\n${phases.map(p => `${p.id}. ${p.title}`).join('\n')}`,
          meta: {
            action_type: 'plan',
            plan_action: 'update',
            plan: plan,
            json: plan
          }
        };
      } else if (action === 'advance') {
        // Validate advance action
        if (!current_phase_id || !next_phase_id) {
          return {
            status: 'failure',
            content: 'Advance action requires current_phase_id and next_phase_id',
            meta: { action_type: 'plan', plan_action: 'advance' }
          };
        }
        
        // Get current plan
        const plan = context.plan;
        if (!plan || !plan.phases) {
          return {
            status: 'failure',
            content: 'No active plan found. Use action "update" to create a plan first.',
            meta: { action_type: 'plan', plan_action: 'advance' }
          };
        }
        
        // Validate phase IDs exist
        const currentPhase = plan.phases.find(p => p.id === current_phase_id);
        const nextPhase = plan.phases.find(p => p.id === next_phase_id);
        
        if (!currentPhase || !nextPhase) {
          return {
            status: 'failure',
            content: 'Invalid phase IDs. Phase IDs must exist in the plan.',
            meta: { action_type: 'plan', plan_action: 'advance' }
          };
        }
        
        // Validate sequential advance (no skipping or going backward)
        if (next_phase_id !== current_phase_id + 1) {
          return {
            status: 'failure',
            content: 'Can only advance to the next sequential phase. Skipping or going backward is not allowed.',
            meta: { action_type: 'plan', plan_action: 'advance' }
          };
        }
        
        // Mark current phase as completed
        currentPhase.status = 'completed';
        nextPhase.status = 'active';
        plan.current_phase_id = next_phase_id;
        
        context.plan = plan;
        
        // Update task manager
        if (context.task_manager) {
          await context.task_manager.updatePlan(plan);
        }
        
        return {
          status: 'success',
          content: `Advanced to phase ${next_phase_id}: ${nextPhase.title}`,
          meta: {
            action_type: 'plan',
            plan_action: 'advance',
            plan: plan,
            current_phase_id: next_phase_id,
            json: plan
          }
        };
      } else {
        return {
          status: 'failure',
          content: `Unknown action: ${action}. Use 'update' or 'advance'.`,
          meta: { action_type: 'plan' }
        };
      }
    } catch (error) {
      console.error('Plan tool error:', error);
      return {
        status: 'failure',
        content: `Plan execution failed: ${error.message}`,
        meta: { action_type: 'plan' }
      };
    }
  }
};

module.exports = Plan;
