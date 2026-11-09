<script setup>
defineProps({
  chartComponent: { type: [Object, Function], required: true },
  chartData: { type: Object, required: true },
  chartOptions: { type: Object, required: true },
  ariaLabel: { type: String, required: true },
  title: { type: String, required: true },
  titleId: { type: String, required: true },
  copy: { type: String, required: true },
  chartClass: { type: String, default: 'bar-chart' },
  chartKey: { type: String, default: '' },
})
</script>

<template>
  <section :id="titleId" class="statistics-card" :aria-labelledby="titleId + '-heading'">
    <div class="statistics-header">
      <h2 :id="titleId + '-heading'" class="statistics-title">{{ title }}</h2>
      <p class="statistics-copy">{{ copy }}</p>
    </div>

    <div class="bar-chart-shell" role="img" :aria-label="ariaLabel">
      <div :class="chartClass">
        <component :is="chartComponent" :key="chartKey || undefined" :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <div class="sr-only">
      <table>
        <caption>{{ title }}詳細數值</caption>
        <thead>
          <tr>
            <th scope="col">項目</th>
            <th v-for="(dataset, index) in chartData.datasets" :key="index" scope="col">{{ dataset.label || '數量' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(label, index) in chartData.labels" :key="index">
            <th scope="row">{{ label }}</th>
            <td v-for="(dataset, datasetIndex) in chartData.datasets" :key="datasetIndex">{{ dataset.data[index] ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
