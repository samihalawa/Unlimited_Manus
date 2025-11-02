<template>
  <a-config-provider :theme="antdThemeConfig">
    <router-view></router-view>
  </a-config-provider>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/store/modules/theme'
import { getAntdTheme, applyCSSVariables } from '@/utils/themeProvider'

const themeStore = useThemeStore()
const { currentTheme } = storeToRefs(themeStore)

// Ant Design theme configuration
const antdThemeConfig = computed(() => getAntdTheme(currentTheme.value))

// Initialize theme on mount
onMounted(() => {
  themeStore.initTheme()
  applyCSSVariables(currentTheme.value)
})

// Watch for theme changes and apply CSS variables
watch(currentTheme, (newTheme) => {
  // Add transitioning class to prevent flash
  document.documentElement.classList.add('theme-transitioning')

  applyCSSVariables(newTheme)

  // Remove transitioning class after brief delay
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning')
  }, 50)
})
</script>

<style scoped>

/* 移动端适配 */
@media (max-width: 768px) {
  .language-switcher {
    display: none;
  }
}
</style>
