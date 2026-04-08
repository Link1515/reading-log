<script setup>
import { RouterLink } from 'vue-router'
import { navigationItems } from '../navigation'
</script>

<template>
  <div class="app-layout">
    <header class="layout-topbar">
      <div class="layout-topbar-main">
        <nav class="app-nav layout-nav" aria-label="主選單">
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

        <slot name="toolbar" />
      </div>

      <slot name="topbar-extra" />
    </header>

    <main class="page-shell">
      <slot />
    </main>
  </div>
</template>
