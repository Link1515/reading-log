<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="statistics-summary" aria-label="借書統計摘要">
    <article v-for="item in items" :key="item.label" class="summary-tile">
      <p class="summary-label">{{ item.label }}</p>
      <p class="summary-value">{{ item.value }}</p>
      <p class="summary-copy">{{ item.copy }}</p>
    </article>
  </section>
</template>
