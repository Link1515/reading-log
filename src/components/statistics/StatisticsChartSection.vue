<script setup>
defineProps({
  chartComponent: {
    type: [Object, Function],
    required: true,
  },
  chartData: {
    type: Object,
    required: true,
  },
  chartOptions: {
    type: Object,
    required: true,
  },
  ariaLabel: {
    type: String,
    required: true,
  },
  sectionLabel: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  titleId: {
    type: String,
    required: true,
  },
  copy: {
    type: String,
    required: true,
  },
  chartShellClass: {
    type: String,
    default: 'bar-chart-shell',
  },
  chartClass: {
    type: String,
    default: 'bar-chart',
  },
  chartKey: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="statistics-card statistics-card-spaced" :aria-labelledby="titleId">
    <div class="statistics-header">
      <div>
        <p class="section-label">{{ sectionLabel }}</p>
        <h2 :id="titleId" class="statistics-title">{{ title }}</h2>
        <p class="statistics-copy">{{ copy }}</p>
      </div>
    </div>

    <div class="statistics-grid">
      <div :class="chartShellClass" role="img" :aria-label="ariaLabel">
        <div :class="chartClass">
          <component :is="chartComponent" :key="chartKey || undefined" :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </div>
  </section>
</template>
