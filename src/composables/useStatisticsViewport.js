import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { MOBILE_BREAKPOINT } from '../utils/statistics/constants'

export function useStatisticsViewport() {
  const viewportWidth = ref(typeof window === 'undefined' ? 1280 : window.innerWidth)

  function updateViewportWidth() {
    viewportWidth.value = window.innerWidth
  }

  onMounted(() => {
    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateViewportWidth)
  })

  const isMobileLayout = computed(() => viewportWidth.value <= MOBILE_BREAKPOINT)
  const chartLayoutKey = computed(() => (isMobileLayout.value ? 'statistics-pie-mobile' : 'statistics-pie-desktop'))

  return {
    viewportWidth,
    isMobileLayout,
    chartLayoutKey,
  }
}
