/**
 * Theme Store - Manages dark/light theme state
 * @author LemonAI Phase 1 Enhancement
 */
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    // Theme state: 'light' | 'dark' | 'auto'
    theme: 'light',
    // System preference detection
    systemPreference: 'light'
  }),

  getters: {
    /**
     * Get current active theme considering auto mode
     */
    currentTheme: (state) => {
      if (state.theme === 'auto') {
        return state.systemPreference
      }
      return state.theme
    },

    /**
     * Check if current theme is dark
     */
    isDark: (state) => {
      const activeTheme = state.theme === 'auto' ? state.systemPreference : state.theme
      return activeTheme === 'dark'
    }
  },

  actions: {
    /**
     * Set theme mode
     * @param {string} mode - 'light' | 'dark' | 'auto'
     */
    setTheme(mode) {
      this.theme = mode
      this.applyTheme()
    },

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
      if (this.theme === 'auto') {
        this.theme = 'light'
      } else {
        this.theme = this.theme === 'light' ? 'dark' : 'light'
      }
      this.applyTheme()
    },

    /**
     * Initialize theme from system preference
     */
    initTheme() {
      // Detect system preference
      if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
        this.systemPreference = darkModeQuery.matches ? 'dark' : 'light'

        // Listen for system theme changes
        darkModeQuery.addEventListener('change', (e) => {
          this.systemPreference = e.matches ? 'dark' : 'light'
          if (this.theme === 'auto') {
            this.applyTheme()
          }
        })
      }

      this.applyTheme()
    },

    /**
     * Apply theme to document
     */
    applyTheme() {
      const activeTheme = this.currentTheme
      document.documentElement.setAttribute('data-theme', activeTheme)

      // Also set class for easier CSS targeting
      if (activeTheme === 'dark') {
        document.documentElement.classList.add('dark-theme')
        document.documentElement.classList.remove('light-theme')
      } else {
        document.documentElement.classList.add('light-theme')
        document.documentElement.classList.remove('dark-theme')
      }
    }
  },

  // Persist theme to localStorage
  persist: {
    key: 'lemonai-theme',
    storage: localStorage,
    paths: ['theme']
  }
})
