/**
 * Theme Provider Utilities
 * Manages theme tokens for Ant Design and CSS variables
 */
import { theme as antdTheme } from 'ant-design-vue'

/**
 * Light theme configuration
 */
export const lightTheme = {
  // Ant Design tokens
  token: {
    colorPrimary: '#1a1a19',
    colorLink: '#1a1a19',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorBgBase: '#ffffff',
    colorBgContainer: '#f8f8f7',
    colorBgLayout: '#f8f8f7',
    colorText: '#000000',
    colorTextSecondary: '#666666',
    colorBorder: '#e5e5e5',
    colorBorderSecondary: '#f0f0f0'
  },

  // CSS variables
  cssVars: {
    '--bg-primary': '#f8f8f7',
    '--bg-secondary': '#ffffff',
    '--bg-sidebar': '#f2f2f2',
    '--bg-hover': '#eaeaea',
    '--bg-active': '#dcdcdc',
    '--text-primary': '#000000',
    '--text-secondary': '#666666',
    '--text-tertiary': '#999999',
    '--border-primary': '#e5e5e5',
    '--border-secondary': '#f0f0f0',
    '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
    '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.12)',
    '--shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.15)'
  }
}

/**
 * Dark theme configuration (matching Manus.im)
 */
export const darkTheme = {
  // Ant Design tokens
  token: {
    colorPrimary: '#ffffff',
    colorLink: '#ffffff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorBgBase: 'rgb(22, 22, 24)',
    colorBgContainer: 'rgb(22, 22, 24)',
    colorBgLayout: 'rgb(22, 22, 24)',
    colorText: '#ffffff',
    colorTextSecondary: '#a0a0a0',
    colorBorder: '#2a2a2c',
    colorBorderSecondary: '#1a1a1c'
  },

  // CSS variables
  cssVars: {
    '--bg-primary': 'rgb(22, 22, 24)',
    '--bg-secondary': 'rgb(28, 28, 30)',
    '--bg-sidebar': 'rgb(33, 33, 34)',
    '--bg-hover': 'rgb(44, 44, 46)',
    '--bg-active': 'rgb(58, 58, 60)',
    '--text-primary': '#ffffff',
    '--text-secondary': '#a0a0a0',
    '--text-tertiary': '#666666',
    '--border-primary': '#2a2a2c',
    '--border-secondary': '#1a1a1c',
    '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
    '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
    '--shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.5)'
  }
}

/**
 * Get theme configuration based on theme mode
 * @param {string} theme - 'light' | 'dark'
 * @returns {object} Theme configuration
 */
export function getThemeConfig(theme) {
  return theme === 'dark' ? darkTheme : lightTheme
}

/**
 * Apply CSS variables to document root
 * @param {string} theme - 'light' | 'dark'
 */
export function applyCSSVariables(theme) {
  const config = getThemeConfig(theme)
  const root = document.documentElement

  Object.entries(config.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

/**
 * Get Ant Design theme configuration
 * @param {string} theme - 'light' | 'dark'
 * @returns {object} Ant Design theme config
 */
export function getAntdTheme(theme) {
  const config = getThemeConfig(theme)
  return {
    token: config.token,
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
  }
}
