<script setup>
defineProps({
  titleId: {
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
  copy: {
    type: String,
    required: true,
  },
  monthLabels: {
    type: Array,
    required: true,
  },
  years: {
    type: Array,
    required: true,
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

    <div class="heatmap-shell" role="img" aria-label="借書密度年月熱圖">
      <div class="heatmap-legend" aria-hidden="true">
        <span>少</span>
        <div class="heatmap-legend-scale">
          <span class="heatmap-swatch is-level-1"></span>
          <span class="heatmap-swatch is-level-2"></span>
          <span class="heatmap-swatch is-level-3"></span>
          <span class="heatmap-swatch is-level-4"></span>
        </div>
        <span>多</span>
      </div>

      <div class="heatmap-grid">
        <div class="heatmap-month-label heatmap-corner"></div>
        <div v-for="label in monthLabels" :key="label" class="heatmap-month-label">
          {{ label }}
        </div>

        <template v-for="year in years" :key="year.year">
          <div class="heatmap-year-label">{{ year.year }}</div>
          <div
            v-for="month in year.months"
            :key="month.monthKey"
            class="heatmap-cell"
            :style="{ '--heat': month.intensity.toFixed(3) }"
            :aria-label="`${month.monthKey} 借閱書籍 ${month.count} 本`"
            :title="`${month.monthKey}：${month.count} 本`"
          >
            <span>{{ month.count }}</span>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
