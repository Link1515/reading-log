<script setup>
import { RouterLink, RouterView } from 'vue-router'

const navigationItems = [
  { name: 'home', label: '閱讀紀錄', to: '/' },
  { name: 'statistics', label: '分析統計', to: '/statistics' },
]
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <nav class="app-nav" aria-label="主選單">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.to"
          class="app-nav-link"
          active-class="is-active"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>
