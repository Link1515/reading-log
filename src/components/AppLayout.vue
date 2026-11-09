<script setup>
import { RouterLink } from 'vue-router'
import { navigationItems } from '../navigation'
</script>

<template>
  <div class="app-layout">
    <header class="site-header">
      <div class="site-header-inner">
        <RouterLink class="site-brand" to="/">閱讀檔案</RouterLink>
        <nav class="site-nav" aria-label="主選單">
          <RouterLink
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.to"
            class="site-nav-link"
            active-class="is-active"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="page-shell">
      <slot />
    </main>
  </div>
</template>
