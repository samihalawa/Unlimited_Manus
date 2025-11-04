import { defineStore } from 'pinia';

export const usePlanStore = defineStore('plan', {
  state: () => ({
    currentPlan: null, // { goal, phases: [{id, title, capabilities, status}], current_phase_id }
    conversationPlans: {}, // Map of conversation_id -> plan
  }),

  getters: {
    /**
     * Get plan for specific conversation
     */
    getPlanByConversation: (state) => (conversationId) => {
      return state.conversationPlans[conversationId] || null;
    },

    /**
     * Get current active phase
     */
    getCurrentPhase: (state) => {
      if (!state.currentPlan || !state.currentPlan.phases) return null;
      return state.currentPlan.phases.find(
        (p) => p.id === state.currentPlan.current_phase_id
      );
    },

    /**
     * Get all phases with status indicators
     */
    getPhasesWithStatus: (state) => {
      if (!state.currentPlan || !state.currentPlan.phases) return [];
      return state.currentPlan.phases.map((phase) => ({
        ...phase,
        isActive: phase.id === state.currentPlan.current_phase_id,
        isCompleted: phase.status === 'completed',
        isPending: phase.status === 'pending',
      }));
    },
  },

  actions: {
    /**
     * Update or create a plan
     */
    updatePlan(planData, conversationId) {
      const plan = {
        goal: planData.goal,
        phases: planData.phases || [],
        current_phase_id: planData.current_phase_id || 1,
        createdAt: planData.createdAt || new Date().toISOString(),
      };

      // Store in conversation-specific map
      if (conversationId) {
        this.conversationPlans[conversationId] = plan;
      }

      // Also set as current plan
      this.currentPlan = plan;
    },

    /**
     * Advance to next phase
     */
    advancePhase(conversationId, currentPhaseId, nextPhaseId) {
      const plan = conversationId 
        ? this.conversationPlans[conversationId] 
        : this.currentPlan;

      if (!plan || !plan.phases) return;

      // Find and update phases
      const currentPhase = plan.phases.find((p) => p.id === currentPhaseId);
      const nextPhase = plan.phases.find((p) => p.id === nextPhaseId);

      if (currentPhase) {
        currentPhase.status = 'completed';
      }

      if (nextPhase) {
        nextPhase.status = 'active';
        plan.current_phase_id = nextPhaseId;
      }

      // Update current plan if this is the active conversation
      if (conversationId && this.conversationPlans[conversationId]) {
        this.currentPlan = this.conversationPlans[conversationId];
      }
    },

    /**
     * Clear plan for a conversation
     */
    clearPlan(conversationId) {
      if (conversationId) {
        delete this.conversationPlans[conversationId];
      }
      if (this.currentPlan && this.currentPlan.conversation_id === conversationId) {
        this.currentPlan = null;
      }
    },

    /**
     * Set current plan from conversation
     */
    setCurrentPlan(conversationId) {
      if (conversationId && this.conversationPlans[conversationId]) {
        this.currentPlan = this.conversationPlans[conversationId];
      }
    },
  },
});
