<template>
  <div class="phase-display" v-if="plan && plan.phases && plan.phases.length > 0">
    <div class="phase-header">
      <div class="phase-goal">
        <span class="goal-label">Goal:</span>
        <span class="goal-text">{{ plan.goal }}</span>
      </div>
    </div>

    <div class="phases-container">
      <div
        v-for="(phase, index) in phasesWithStatus"
        :key="phase.id"
        class="phase-item"
        :class="{
          active: phase.isActive,
          completed: phase.isCompleted,
          pending: phase.isPending,
        }"
      >
        <div class="phase-indicator">
          <div class="phase-number">
            <CheckOutlined v-if="phase.isCompleted" class="check-icon" />
            <LoadingOutlined v-else-if="phase.isActive" class="loading-icon" />
            <span v-else>{{ phase.id }}</span>
          </div>
          <div class="phase-connector" v-if="index < phasesWithStatus.length - 1"></div>
        </div>

        <div class="phase-content">
          <div class="phase-title">{{ phase.title }}</div>
          <div class="phase-status" v-if="phase.isActive">
            <span class="status-text">In Progress</span>
          </div>
          <div class="phase-status completed-status" v-if="phase.isCompleted">
            <span class="status-text">Completed</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePlanStore } from '@/store/modules/plan';
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { storeToRefs } from 'pinia';

const planStore = usePlanStore();
const { currentPlan } = storeToRefs(planStore);

const plan = computed(() => currentPlan.value);

const phasesWithStatus = computed(() => {
  return planStore.getPhasesWithStatus;
});
</script>

<style lang="scss" scoped>
.phase-display {
  margin: 16px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e0e0e0;

  .phase-header {
    margin-bottom: 20px;

    .phase-goal {
      display: flex;
      align-items: baseline;
      gap: 8px;

      .goal-label {
        font-weight: 600;
        font-size: 14px;
        color: #666;
      }

      .goal-text {
        font-size: 16px;
        font-weight: 500;
        color: #1a1a1a;
        line-height: 1.5;
      }
    }
  }

  .phases-container {
    display: flex;
    flex-direction: column;
    gap: 0;

    .phase-item {
      display: flex;
      gap: 12px;
      position: relative;

      .phase-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;

        .phase-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          background: #e0e0e0;
          color: #666;
          flex-shrink: 0;
          z-index: 1;

          .check-icon,
          .loading-icon {
            font-size: 16px;
          }
        }

        .phase-connector {
          width: 2px;
          flex: 1;
          background: #e0e0e0;
          min-height: 40px;
        }
      }

      .phase-content {
        flex: 1;
        padding: 4px 0 16px 0;

        .phase-title {
          font-size: 15px;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .phase-status {
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 4px;

          .status-text {
            color: #1890ff;
          }

          &.completed-status .status-text {
            color: #52c41a;
          }
        }
      }

      &.active {
        .phase-indicator .phase-number {
          background: #1890ff;
          color: #fff;
          box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.1);
        }

        .phase-content .phase-title {
          color: #1890ff;
          font-weight: 600;
        }
      }

      &.completed {
        .phase-indicator .phase-number {
          background: #52c41a;
          color: #fff;
        }

        .phase-indicator .phase-connector {
          background: #52c41a;
        }

        .phase-content .phase-title {
          color: #666;
        }
      }

      &.pending {
        .phase-content .phase-title {
          color: #999;
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .phase-display {
    padding: 12px;

    .phase-header .phase-goal {
      flex-direction: column;
      gap: 4px;

      .goal-text {
        font-size: 14px;
      }
    }

    .phases-container .phase-item {
      .phase-indicator .phase-number {
        width: 28px;
        height: 28px;
        font-size: 12px;
      }

      .phase-content {
        .phase-title {
          font-size: 14px;
        }
      }
    }
  }
}
</style>
