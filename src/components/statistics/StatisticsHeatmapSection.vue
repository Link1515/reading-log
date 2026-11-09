<script setup>
defineProps({
  titleId: { type: String, required: true },
  title: { type: String, required: true },
  copy: { type: String, required: true },
  monthLabels: { type: Array, required: true },
  years: { type: Array, required: true },
})
</script>

<template>
  <section :id="titleId" class="statistics-card" :aria-labelledby="titleId + '-heading'">
    <div class="statistics-header">
      <h2 :id="titleId + '-heading'" class="statistics-title">{{ title }}</h2>
      <p class="statistics-copy">{{ copy }}</p>
    </div>

    <div class="heatmap-shell">
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
      <p class="heatmap-scroll-hint">左右滑動查看月份</p>
      <div class="heatmap-scroll">
        <table class="heatmap-table">
          <caption class="sr-only">各年每月借閱書籍數量；顏色越亮代表數量越多</caption>
          <thead>
            <tr>
              <th scope="col">年份</th>
              <th v-for="label in monthLabels" :key="label" scope="col">{{ label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="year in years" :key="year.year">
              <th scope="row">{{ year.year }}</th>
              <td v-for="month in year.months" :key="month.monthKey" :title="month.monthKey + '：' + month.count + ' 本'">
                <span class="heatmap-cell" :style="{ '--heat': month.intensity.toFixed(3) }">{{ month.count }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
