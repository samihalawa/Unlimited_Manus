/**
 * Notification Composable
 * Provides easy-to-use notification methods
 * @author LemonAI Phase 1 Enhancement
 */
import { notification } from 'ant-design-vue'
import { useNotificationStore } from '@/store/modules/notification'

/**
 * Use notification hook
 * @returns {object} Notification methods
 */
export function useNotification() {
  const notificationStore = useNotificationStore()

  /**
   * Show a notification toast and add to history
   * @param {object} options - Notification options
   */
  const show = ({ type, title, message, duration = 5000 }) => {
    // Add to store for history
    const id = notificationStore.addNotification({ type, title, message, duration })

    // Show toast notification
    notification[type]({
      message: title,
      description: message,
      duration: duration / 1000, // Convert to seconds
      placement: 'bottomRight',
      key: `notification-${id}`,
      style: {
        borderRadius: '8px'
      }
    })

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        notificationStore.markAsRead(id)
      }, duration)
    }

    return id
  }

  /**
   * Show success notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} duration - Auto-dismiss duration (default: 5000ms)
   */
  const success = (title, message, duration = 5000) => {
    return show({ type: 'success', title, message, duration })
  }

  /**
   * Show error notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} duration - Auto-dismiss duration (default: 5000ms)
   */
  const error = (title, message, duration = 5000) => {
    return show({ type: 'error', title, message, duration })
  }

  /**
   * Show warning notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} duration - Auto-dismiss duration (default: 5000ms)
   */
  const warning = (title, message, duration = 5000) => {
    return show({ type: 'warning', title, message, duration })
  }

  /**
   * Show info notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} duration - Auto-dismiss duration (default: 5000ms)
   */
  const info = (title, message, duration = 5000) => {
    return show({ type: 'info', title, message, duration })
  }

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    notification.destroy()
    notificationStore.clearAll()
  }

  return {
    show,
    success,
    error,
    warning,
    info,
    clearAll
  }
}
