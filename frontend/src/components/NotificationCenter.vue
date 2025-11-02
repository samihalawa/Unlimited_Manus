<template>
  <a-dropdown :trigger="['click']" placement="bottomRight" v-model:open="dropdownVisible">
    <div class="notification-trigger">
      <a-badge :count="unreadCount" :overflow-count="99">
        <BellOutlined :style="{ fontSize: '18px', color: 'var(--text-primary)' }" />
      </a-badge>
    </div>

    <template #overlay>
      <div class="notification-dropdown">
        <div class="notification-header">
          <span class="notification-title">Notifications</span>
          <a-button v-if="notifications.length > 0" type="text" size="small" @click="handleMarkAllRead">
            Mark all read
          </a-button>
        </div>

        <div class="notification-list">
          <div v-if="notifications.length === 0" class="notification-empty">
            <InboxOutlined :style="{ fontSize: '48px', color: '#d9d9d9' }" />
            <p>No notifications</p>
          </div>

          <div
            v-for="notification in recentNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'notification-unread': !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon" :class="`notification-icon-${notification.type}`">
              <CheckCircleOutlined v-if="notification.type === 'success'" />
              <CloseCircleOutlined v-else-if="notification.type === 'error'" />
              <WarningOutlined v-else-if="notification.type === 'warning'" />
              <InfoCircleOutlined v-else />
            </div>

            <div class="notification-content">
              <div class="notification-item-title">{{ notification.title }}</div>
              <div class="notification-item-message">{{ notification.message }}</div>
              <div class="notification-item-time">{{ formatTime(notification.timestamp) }}</div>
            </div>

            <a-button
              type="text"
              size="small"
              class="notification-close"
              @click.stop="handleRemoveNotification(notification.id)"
            >
              <CloseOutlined />
            </a-button>
          </div>
        </div>

        <div v-if="notifications.length > 0" class="notification-footer">
          <a-button type="text" size="small" @click="handleClearAll">
            Clear all
          </a-button>
        </div>
      </div>
    </template>
  </a-dropdown>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  InboxOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { useNotificationStore } from '@/store/modules/notification'
import { formatDistanceToNow } from 'date-fns'

const notificationStore = useNotificationStore()
const { recentNotifications, unreadCount, allNotifications: notifications } = storeToRefs(notificationStore)

const dropdownVisible = ref(false)

/**
 * Format notification timestamp
 */
const formatTime = (timestamp) => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return 'Just now'
  }
}

/**
 * Handle notification click
 */
const handleNotificationClick = (notification) => {
  notificationStore.markAsRead(notification.id)
}

/**
 * Mark all notifications as read
 */
const handleMarkAllRead = () => {
  notificationStore.markAllAsRead()
}

/**
 * Remove a specific notification
 */
const handleRemoveNotification = (id) => {
  notificationStore.removeNotification(id)
}

/**
 * Clear all notifications
 */
const handleClearAll = () => {
  notificationStore.clearAll()
  dropdownVisible.value = false
}
</script>

<style lang="scss" scoped>
.notification-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-hover);
  }
}

.notification-dropdown {
  width: 380px;
  max-width: 90vw;
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-primary);
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--text-tertiary);

  p {
    margin-top: 8px;
    font-size: 14px;
  }
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-secondary);
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;

  &:hover {
    background-color: var(--bg-hover);
  }

  &:last-child {
    border-bottom: none;
  }
}

.notification-unread {
  background-color: var(--bg-primary);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #1890ff;
  }
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 16px;

  &.notification-icon-success {
    background: #f6ffed;
    color: #52c41a;
  }

  &.notification-icon-error {
    background: #fff2f0;
    color: #ff4d4f;
  }

  &.notification-icon-warning {
    background: #fffbe6;
    color: #faad14;
  }

  &.notification-icon-info {
    background: #e6f7ff;
    color: #1890ff;
  }
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-item-message {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-item-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.notification-close {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;

  .notification-item:hover & {
    opacity: 1;
  }
}

.notification-footer {
  display: flex;
  justify-content: center;
  padding: 8px 16px;
  border-top: 1px solid var(--border-primary);
  background: var(--bg-primary);
}

/* Scrollbar styling */
.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

.notification-list::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;

  &:hover {
    background: var(--text-tertiary);
  }
}
</style>
