<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Bar, Pie } from 'vue-chartjs'
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import AppLayout from '../components/AppLayout.vue'
import books from '../data/generated/books.json'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const PIE_COLORS = ['#60cdff', '#4f7cff', '#43d3c5', '#f59e0b', '#f97373', '#a78bfa', '#34d399', '#f472b6']

const OTHER_COLOR = '#64748b'
const MAX_VISIBLE_CATEGORIES = 5
const MOBILE_BREAKPOINT = 640

const viewportWidth = ref(typeof window === 'undefined' ? 1280 : window.innerWidth)

function getReadCount(book) {
  return book.type === 'series' ? book.volumes.length : 1
}

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth
}

const totalReadCount = computed(() => books.reduce((total, book) => total + getReadCount(book), 0))
const totalCategoryCount = computed(() => new Set(books.map(book => book.category)).size)
const totalAuthorCount = computed(() => new Set(books.map(book => book.author)).size)

const categoryStats = computed(() => {
  const categoryCountMap = new Map()

  for (const book of books) {
    const readCount = getReadCount(book)
    const currentCount = categoryCountMap.get(book.category) ?? 0
    categoryCountMap.set(book.category, currentCount + readCount)
  }

  const rankedCategories = [...categoryCountMap.entries()]
    .toSorted((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-Hant'))
    .map(([category, count], index) => ({
      category,
      count,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }))

  if (rankedCategories.length <= MAX_VISIBLE_CATEGORIES) {
    return rankedCategories.map(slice => ({
      ...slice,
      ratio: totalReadCount.value === 0 ? 0 : slice.count / totalReadCount.value,
      percentage: totalReadCount.value === 0 ? '0.0' : ((slice.count / totalReadCount.value) * 100).toFixed(1),
    }))
  }

  const leadingCategories = rankedCategories.slice(0, MAX_VISIBLE_CATEGORIES)
  const otherCount = rankedCategories.slice(MAX_VISIBLE_CATEGORIES).reduce((total, item) => total + item.count, 0)

  return [...leadingCategories, { category: '其他', count: otherCount, color: OTHER_COLOR }].map(slice => ({
    ...slice,
    ratio: totalReadCount.value === 0 ? 0 : slice.count / totalReadCount.value,
    percentage: totalReadCount.value === 0 ? '0.0' : ((slice.count / totalReadCount.value) * 100).toFixed(1),
  }))
})

const topCategory = computed(() => categoryStats.value[0] ?? null)

const authorStats = computed(() => {
  const authorCountMap = new Map()

  for (const book of books) {
    const readCount = getReadCount(book)
    const currentCount = authorCountMap.get(book.author) ?? 0
    authorCountMap.set(book.author, currentCount + readCount)
  }

  const rankedAuthors = [...authorCountMap.entries()]
    .toSorted((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-Hant'))
    .map(([author, count], index) => ({
      author,
      count,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }))

  if (rankedAuthors.length <= MAX_VISIBLE_CATEGORIES) {
    return rankedAuthors.map(entry => ({
      ...entry,
      percentage: totalReadCount.value === 0 ? '0.0' : ((entry.count / totalReadCount.value) * 100).toFixed(1),
    }))
  }

  return rankedAuthors.slice(0, MAX_VISIBLE_CATEGORIES).map(entry => ({
    ...entry,
    percentage: totalReadCount.value === 0 ? '0.0' : ((entry.count / totalReadCount.value) * 100).toFixed(1),
  }))
})

const topAuthor = computed(() => authorStats.value[0] ?? null)

const pieChartData = computed(() => ({
  labels: categoryStats.value.map(slice => slice.category),
  datasets: [
    {
      data: categoryStats.value.map(slice => slice.count),
      backgroundColor: categoryStats.value.map(slice => slice.color),
      borderColor: 'rgba(18, 23, 34, 0.9)',
      borderWidth: 2,
      hoverOffset: 6,
    },
  ],
}))

const isMobileLayout = computed(() => viewportWidth.value <= MOBILE_BREAKPOINT)
const chartLayoutKey = computed(() => (isMobileLayout.value ? 'statistics-pie-mobile' : 'statistics-pie-desktop'))

const pieChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: isMobileLayout.value ? { top: 8, right: 8, bottom: 8, left: 8 } : { top: 8, right: 24, bottom: 8, left: 8 },
  },
  plugins: {
    legend: {
      display: true,
      position: isMobileLayout.value ? 'bottom' : 'right',
      align: 'center',
      labels: {
        color: '#ffffff',
        boxWidth: 12,
        boxHeight: 12,
        padding: isMobileLayout.value ? 16 : 18,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: isMobileLayout.value ? 13 : 14,
        },
        generateLabels(chart) {
          const dataset = chart.data.datasets[0]
          const values = dataset.data.map(value => Number(value))
          const total = values.reduce((sum, value) => sum + value, 0)

          return chart.data.labels.map((label, index) => {
            const value = values[index] ?? 0
            const percentage = total === 0 ? '0.0' : ((value / total) * 100).toFixed(1)
            const backgroundColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[index] : dataset.backgroundColor

            return {
              text: `${label} ${percentage}%`,
              fillStyle: backgroundColor,
              strokeStyle: backgroundColor,
              fontColor: '#ffffff',
              pointStyle: 'circle',
              hidden: !chart.getDataVisibility(index),
              index,
            }
          })
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(20, 23, 29, 0.96)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      displayColors: false,
      callbacks: {
        label(context) {
          const total = context.dataset.data.reduce((sum, value) => sum + value, 0)
          const value = Number(context.raw)
          const percentage = total === 0 ? '0.0' : ((value / total) * 100).toFixed(1)
          return `${context.label}: ${value} 本 (${percentage}%)`
        },
      },
    },
  },
}))

const authorChartData = computed(() => ({
  labels: authorStats.value.map(entry => entry.author),
  datasets: [
    {
      data: authorStats.value.map(entry => entry.count),
      backgroundColor: authorStats.value.map(entry => entry.color),
      borderColor: 'rgba(18, 23, 34, 0.9)',
      borderWidth: 1,
      borderRadius: 10,
      borderSkipped: false,
      barThickness: isMobileLayout.value ? 20 : 26,
      maxBarThickness: isMobileLayout.value ? 20 : 26,
    },
  ],
}))

const authorChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  animation: {
    duration: 220,
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        color: '#c8c6c4',
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.08)',
      },
      border: {
        display: false,
      },
    },
    y: {
      ticks: {
        color: '#f3f2f1',
        font: {
          size: isMobileLayout.value ? 12 : 13,
        },
      },
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(20, 23, 29, 0.96)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      displayColors: false,
      callbacks: {
        label(context) {
          const value = Number(context.raw)
          const percentage = totalReadCount.value === 0 ? '0.0' : ((value / totalReadCount.value) * 100).toFixed(1)
          return `${context.label}: ${value} 本 (${percentage}%)`
        },
      },
    },
  },
}))

onMounted(() => {
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
})
</script>

<template>
  <AppLayout>
    <section class="hero">
      <p class="eyebrow">Reading Insights</p>
      <h1>分析統計</h1>
      <p class="hero-copy">閱讀足跡分析</p>
    </section>

    <section v-if="totalReadCount > 0" class="statistics-card" aria-labelledby="category-distribution-title">
      <div class="statistics-header">
        <div>
          <p class="section-label">Category Distribution</p>
          <h2 id="category-distribution-title" class="statistics-title">分類占比</h2>
          <p class="statistics-copy">
            總共 {{ totalReadCount }} 本
            <span v-if="topCategory">，目前最多的是 {{ topCategory.category }}（{{ topCategory.count }} 本）</span>
          </p>
        </div>
      </div>

      <div class="statistics-grid">
        <div class="pie-chart-shell" role="img" aria-label="各分類占比圓餅圖">
          <div class="pie-chart">
            <Pie :key="chartLayoutKey" :data="pieChartData" :options="pieChartOptions" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="totalReadCount > 0" class="statistics-card statistics-card-spaced" aria-labelledby="author-ranking-title">
      <div class="statistics-header">
        <div>
          <p class="section-label">Author Ranking</p>
          <h2 id="author-ranking-title" class="statistics-title">作者閱讀量排行</h2>
          <p class="statistics-copy">
            共統計 {{ totalAuthorCount }} 位作者，只顯示前五名
            <span v-if="topAuthor">，目前最多的是 {{ topAuthor.author }}（{{ topAuthor.count }} 本）</span>
          </p>
        </div>
      </div>

      <div class="statistics-grid">
        <div class="bar-chart-shell" role="img" aria-label="作者閱讀量排行長條圖">
          <div class="bar-chart">
            <Bar :data="authorChartData" :options="authorChartOptions" />
          </div>
        </div>
      </div>
    </section>

    <section v-else class="empty-state" aria-label="分析統計頁面空狀態">
      <h2 class="empty-title">目前沒有可分析的閱讀資料</h2>
      <p class="empty-copy">等 `generated/books.json` 有內容後，這裡會顯示分類占比與作者閱讀量排行。</p>
    </section>
  </AppLayout>
</template>
