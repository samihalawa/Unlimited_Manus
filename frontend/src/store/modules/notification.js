/**
 * Notification Store - Manages notification state and history
 * @author LemonAI Phase 1 Enhancement
 */
import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    // Notification history
    notifications: [],
    // Counter for notification IDs
    notificationIdCounter: 0
  }),

  getters: {
    /**
     * Get unread notification count
     */
    unreadCount: (state) => {
      return state.notifications.filter(n => !n.read).length
    },

    /**
     * Get recent notifications (last 10)
     */
    recentNotifications: (state) => {
      return state.notifications
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
    },

    /**
     * Get all notifications sorted by timestamp
     */
    allNotifications: (state) => {
      return state.notifications
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }
  },

  actions: {
    /**
     * Add a new notification
     * @param {object} notification - Notification object
     * @param {string} notification.type - 'success' | 'error' | 'warning' | 'info'
     * @param {string} notification.title - Notification title
     * @param {string} notification.message - Notification message
     * @param {number} notification.duration - Auto-dismiss duration in ms (default: 5000)
     */
    addNotification({ type, title, message, duration = 5000 }) {
      const id = ++this.notificationIdCounter
      const notification = {
        id,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        duration
      }

      this.notifications.push(notification)

      // Return notification ID for tracking
      return id
    },

    /**
     * Mark notification as read
     * @param {number} id - Notification ID
     */
    markAsRead(id) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
      }
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead() {
      this.notifications.forEach(n => {
        n.read = true
      })
    },

    /**
     * Remove a notification
     * @param {number} id - Notification ID
     */
    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        this.notifications.splice(index, 1)
      }
    },

    /**
     * Clear all notifications
     */
    clearAll() {
      this.notifications = []
    },

    /**
     * Clear old notifications (keep last 50)
     */
    cleanupOldNotifications() {
      if (this.notifications.length > 50) {
        // Keep only the most recent 50 notifications
        this.notifications = this.notifications
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 50)
      }
    }
  },

  // Persist notifications to localStorage
  persist: {
    key: 'lemonai-notifications',
    storage: localStorage,
    paths: ['notifications', 'notificationIdCounter']
  }
})
