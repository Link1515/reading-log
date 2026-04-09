<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Bar, Pie } from 'vue-chartjs'
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import AppLayout from '../components/AppLayout.vue'
import books from '../data/generated/books.json'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const CATEGORY_COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#17becf']
const SERIES_COLORS = ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#b07aa1']
const OTHER_COLOR = '#7f7f7f'
const MOBILE_BREAKPOINT = 640
const MAX_VISIBLE_CATEGORIES = 5
const MAX_TOP_SERIES = 5
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const viewportWidth = ref(typeof window === 'undefined' ? 1280 : window.innerWidth)

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth
}

function formatMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function getPercentage(value, total) {
  return total === 0 ? '0.0' : ((value / total) * 100).toFixed(1)
}

function buildCountMap(items, keyGetter) {
  const countMap = new Map()

  for (const item of items) {
    const key = keyGetter(item)
    countMap.set(key, (countMap.get(key) ?? 0) + 1)
  }

  return countMap
}

const borrowStarts = computed(() => books.flatMap(book => {
  if (book.type === 'series') {
    return book.volumes.map(volume => ({
      id: volume.id,
      author: book.author,
      category: book.category,
      date: volume.readDate,
      year: volume.readDate.slice(0, 4),
      monthKey: volume.readDate.slice(0, 7),
    }))
  }

  return [{
    id: book.id,
    author: book.author,
    category: book.category,
    date: book.readDate,
    year: book.readDate.slice(0, 4),
    monthKey: book.readDate.slice(0, 7),
  }]
}).toSorted((left, right) => left.date.localeCompare(right.date)))

const yearlyBorrowStats = computed(() => {
  const countMap = buildCountMap(borrowStarts.value, entry => entry.year)

  return [...countMap.entries()]
    .toSorted((left, right) => left[0].localeCompare(right[0]))
    .map(([year, count]) => ({ year, count }))
})

const years = computed(() => yearlyBorrowStats.value.map(entry => entry.year))
const totalBorrowStartCount = computed(() => borrowStarts.value.length)
const totalCategoryCount = computed(() => new Set(borrowStarts.value.map(entry => entry.category)).size)
const totalAuthorCount = computed(() => new Set(borrowStarts.value.map(entry => entry.author)).size)
const totalSeriesCount = computed(() => books.filter(book => book.type === 'series').length)
const averageBorrowStartsPerYear = computed(() => {
  if (years.value.length === 0) {
    return '0.0'
  }

  return (totalBorrowStartCount.value / years.value.length).toFixed(1)
})

const categoryStats = computed(() => {
  const total = totalBorrowStartCount.value
  const rankedCategories = [...buildCountMap(borrowStarts.value, entry => entry.category).entries()]
    .toSorted((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-Hant'))
    .map(([category, count], index) => ({
      category,
      count,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))

  if (rankedCategories.length <= MAX_VISIBLE_CATEGORIES) {
    return rankedCategories.map(entry => ({
      ...entry,
      percentage: getPercentage(entry.count, total),
    }))
  }

  const leadingCategories = rankedCategories.slice(0, MAX_VISIBLE_CATEGORIES)
  const otherCount = rankedCategories.slice(MAX_VISIBLE_CATEGORIES).reduce((sum, entry) => sum + entry.count, 0)

  return [...leadingCategories, { category: '其他', count: otherCount, color: OTHER_COLOR }].map(entry => ({
    ...entry,
    percentage: getPercentage(entry.count, total),
  }))
})

const topCategory = computed(() => categoryStats.value[0] ?? null)
const topBorrowingYear = computed(() => yearlyBorrowStats.value
  .toSorted((left, right) => right.count - left.count || left.year.localeCompare(right.year))[0] ?? null)

const authorExplorationStats = computed(() => {
  const firstSeenYearMap = new Map()

  for (const entry of borrowStarts.value) {
    if (!firstSeenYearMap.has(entry.author)) {
      firstSeenYearMap.set(entry.author, entry.year)
    }
  }

  return years.value.map(year => {
    const entriesInYear = borrowStarts.value.filter(entry => entry.year === year)
    const uniqueAuthors = new Set(entriesInYear.map(entry => entry.author)).size
    const newAuthors = entriesInYear.filter(entry => firstSeenYearMap.get(entry.author) === year)

    return {
      year,
      uniqueAuthors,
      newAuthors: new Set(newAuthors.map(entry => entry.author)).size,
    }
  })
})

const topAuthorExplorationYear = computed(() => authorExplorationStats.value
  .toSorted((left, right) => right.uniqueAuthors - left.uniqueAuthors || left.year.localeCompare(right.year))[0] ?? null)

const seriesLaunchStats = computed(() => books
  .filter(book => book.type === 'series')
  .map(book => ({
    title: book.title,
    volumeCount: book.volumeCount,
    startDate: book.startReadDate,
  }))
  .toSorted((left, right) => right.volumeCount - left.volumeCount || left.startDate.localeCompare(right.startDate))
  .slice(0, MAX_TOP_SERIES))

const seriesLaunchChartEntries = computed(() => seriesLaunchStats.value
  .map((book, index) => ({
    title: book.title,
    volumeCount: book.volumeCount,
    startDate: book.startDate,
    color: SERIES_COLORS[index],
  }))
  .toSorted((left, right) => left.volumeCount - right.volumeCount || left.startDate.localeCompare(right.startDate)))

const topSeries = computed(() => seriesLaunchChartEntries.value.at(-1) ?? null)

const categoryYearlyStats = computed(() => {
  const topCategories = categoryStats.value
    .filter(entry => entry.category !== '其他')
    .map(entry => entry.category)

  const yearCategoryMap = new Map(years.value.map(year => [year, new Map()]))

  for (const entry of borrowStarts.value) {
    const yearMap = yearCategoryMap.get(entry.year)
    const bucket = topCategories.includes(entry.category) ? entry.category : '其他'
    yearMap.set(bucket, (yearMap.get(bucket) ?? 0) + 1)
  }

  return years.value.map(year => ({
    year,
    values: topCategories.map(category => yearCategoryMap.get(year).get(category) ?? 0),
    other: yearCategoryMap.get(year).get('其他') ?? 0,
  }))
})

const heatmapStats = computed(() => {
  const countMap = buildCountMap(borrowStarts.value, entry => entry.monthKey)
  const maxCount = Math.max(...countMap.values(), 0)

  return years.value.map(year => ({
    year,
    months: MONTH_LABELS.map((_, monthIndex) => {
      const monthKey = formatMonthKey(year, monthIndex + 1)
      const count = countMap.get(monthKey) ?? 0
      const intensity = maxCount === 0 ? 0 : count / maxCount

      return {
        monthKey,
        count,
        intensity,
      }
    }),
  }))
})

const highestDensityMonth = computed(() => {
  const allMonths = heatmapStats.value.flatMap(year => year.months)

  return allMonths
    .toSorted((left, right) => right.count - left.count || left.monthKey.localeCompare(right.monthKey))[0] ?? null
})

const borrowingTrendChartData = computed(() => ({
  labels: yearlyBorrowStats.value.map(entry => entry.year),
  datasets: [
    {
      label: '借書啟動數',
      data: yearlyBorrowStats.value.map(entry => entry.count),
      backgroundColor: 'rgba(96, 205, 255, 0.76)',
      borderColor: '#60cdff',
      borderWidth: 1,
      borderRadius: 10,
      borderSkipped: false,
      maxBarThickness: 44,
    },
  ],
}))

const categoryChartData = computed(() => ({
  labels: categoryStats.value.map(entry => entry.category),
  datasets: [
    {
      data: categoryStats.value.map(entry => entry.count),
      backgroundColor: categoryStats.value.map(entry => entry.color),
      borderColor: 'rgba(18, 23, 34, 0.9)',
      borderWidth: 2,
      hoverOffset: 6,
    },
  ],
}))

const authorExplorationChartData = computed(() => ({
  labels: authorExplorationStats.value.map(entry => entry.year),
  datasets: [
    {
      label: '接觸的作者數',
      data: authorExplorationStats.value.map(entry => entry.uniqueAuthors),
      backgroundColor: 'rgba(79, 124, 255, 0.78)',
      borderColor: '#4f7cff',
      borderWidth: 1,
      borderRadius: 10,
      borderSkipped: false,
      maxBarThickness: 38,
    },
    {
      label: '首次接觸的新作者',
      data: authorExplorationStats.value.map(entry => entry.newAuthors),
      backgroundColor: 'rgba(34, 211, 238, 0.72)',
      borderColor: '#22d3ee',
      borderWidth: 1,
      borderRadius: 10,
      borderSkipped: false,
      maxBarThickness: 38,
    },
  ],
}))

const seriesLaunchChartData = computed(() => ({
  labels: seriesLaunchChartEntries.value.map(entry => entry.title),
  datasets: [
    {
      label: '系列總集數',
      data: seriesLaunchChartEntries.value.map(entry => entry.volumeCount),
      backgroundColor: seriesLaunchChartEntries.value.map(entry => entry.color),
      borderColor: 'rgba(18, 23, 34, 0.9)',
      borderWidth: 1,
      borderRadius: 10,
      borderSkipped: false,
      barThickness: viewportWidth.value <= MOBILE_BREAKPOINT ? 18 : 24,
      maxBarThickness: viewportWidth.value <= MOBILE_BREAKPOINT ? 18 : 24,
    },
  ],
}))

const categoryTimelineChartData = computed(() => {
  const visibleCategories = categoryStats.value
    .filter(entry => entry.category !== '其他')
    .map(entry => entry.category)

  const datasets = visibleCategories.map((category, index) => ({
    label: category,
    data: categoryYearlyStats.value.map(entry => entry.values[index] ?? 0),
    backgroundColor: categoryStats.value.find(entry => entry.category === category)?.color ?? CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    borderWidth: 0,
    borderRadius: 6,
    borderSkipped: false,
    maxBarThickness: 42,
  }))

  if (categoryStats.value.some(entry => entry.category === '其他')) {
    datasets.push({
      label: '其他',
      data: categoryYearlyStats.value.map(entry => entry.other),
      backgroundColor: OTHER_COLOR,
      borderWidth: 0,
      borderRadius: 0,
      borderSkipped: false,
      maxBarThickness: 42,
    })
  }

  return {
    labels: years.value,
    datasets,
  }
})

const isMobileLayout = computed(() => viewportWidth.value <= MOBILE_BREAKPOINT)
const chartLayoutKey = computed(() => (isMobileLayout.value ? 'statistics-pie-mobile' : 'statistics-pie-desktop'))

const baseVerticalBarOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 220,
  },
  scales: {
    x: {
      ticks: {
        color: '#c8c6c4',
      },
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#f3f2f1',
        precision: 0,
        font: {
          size: isMobileLayout.value ? 12 : 13,
        },
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.08)',
      },
      border: {
        display: false,
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: '#f3f2f1',
        boxWidth: 12,
        boxHeight: 12,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(20, 23, 29, 0.96)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      displayColors: true,
    },
  },
}))

const baseHorizontalBarOptions = computed(() => ({
  ...baseVerticalBarOptions.value,
  indexAxis: 'y',
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        color: '#c8c6c4',
        precision: 0,
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
}))

const borrowingTrendChartOptions = computed(() => ({
  ...baseVerticalBarOptions.value,
  plugins: {
    ...baseVerticalBarOptions.value.plugins,
    legend: {
      display: false,
    },
    tooltip: {
      ...baseVerticalBarOptions.value.plugins.tooltip,
      displayColors: false,
      callbacks: {
        label(context) {
          const value = Number(context.raw)
          const percentage = getPercentage(value, totalBorrowStartCount.value)
          return `${context.label}: ${value} 本 (${percentage}%)`
        },
      },
    },
  },
}))

const categoryChartOptions = computed(() => ({
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
            const percentage = getPercentage(value, total)
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
          const percentage = getPercentage(value, total)
          return `${context.label}: ${value} 本 (${percentage}%)`
        },
      },
    },
  },
}))

const authorExplorationChartOptions = computed(() => ({
  ...baseVerticalBarOptions.value,
  plugins: {
    ...baseVerticalBarOptions.value.plugins,
    tooltip: {
      ...baseVerticalBarOptions.value.plugins.tooltip,
      callbacks: {
        label(context) {
          return `${context.dataset.label}: ${Number(context.raw)} 位`
        },
      },
    },
  },
}))

const seriesLaunchChartOptions = computed(() => ({
  ...baseHorizontalBarOptions.value,
  plugins: {
    ...baseHorizontalBarOptions.value.plugins,
    legend: {
      display: false,
    },
    tooltip: {
      ...baseHorizontalBarOptions.value.plugins.tooltip,
      displayColors: false,
      callbacks: {
        label(context) {
          const sortedEntry = seriesLaunchChartEntries.value[context.dataIndex]
          return `${context.label}: ${Number(context.raw)} 集，起點 ${sortedEntry.startDate}`
        },
      },
    },
  },
  scales: {
    ...baseHorizontalBarOptions.value.scales,
    x: {
      ...baseHorizontalBarOptions.value.scales.x,
      title: {
        display: false,
      },
    },
    y: {
      ...baseHorizontalBarOptions.value.scales.y,
      ticks: {
        ...baseHorizontalBarOptions.value.scales.y.ticks,
        autoSkip: false,
      },
    },
  },
}))

const categoryTimelineChartOptions = computed(() => ({
  ...baseVerticalBarOptions.value,
  scales: {
    ...baseVerticalBarOptions.value.scales,
    x: {
      ...baseVerticalBarOptions.value.scales.x,
      stacked: true,
    },
    y: {
      ...baseVerticalBarOptions.value.scales.y,
      stacked: true,
    },
  },
  plugins: {
    ...baseVerticalBarOptions.value.plugins,
    tooltip: {
      ...baseVerticalBarOptions.value.plugins.tooltip,
      callbacks: {
        label(context) {
          const value = Number(context.raw)
          return `${context.dataset.label}: ${value} 本`
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
      <p class="eyebrow">Borrowing Insights</p>
      <h1>分析統計</h1>
      <p class="hero-copy">以下圖表都以開始借書日期為準，呈現的是借閱啟動與選書偏好，不代表完讀時間。</p>
    </section>

    <section v-if="totalBorrowStartCount > 0" class="statistics-summary" aria-label="借書統計摘要">
      <article class="summary-tile">
        <p class="summary-label">Borrow Starts</p>
        <p class="summary-value">{{ totalBorrowStartCount }}</p>
        <p class="summary-copy">總借閱書籍數量</p>
      </article>
      <article class="summary-tile">
        <p class="summary-label">Categories</p>
        <p class="summary-value">{{ totalCategoryCount }}</p>
        <p class="summary-copy">涵蓋 {{ totalCategoryCount }} 種分類</p>
      </article>
      <article class="summary-tile">
        <p class="summary-label">Authors</p>
        <p class="summary-value">{{ totalAuthorCount }}</p>
        <p class="summary-copy">接觸過 {{ totalAuthorCount }} 位作者</p>
      </article>
      <article class="summary-tile">
        <p class="summary-label">Series</p>
        <p class="summary-value">{{ totalSeriesCount }}</p>
        <p class="summary-copy">平均每年借閱 {{ averageBorrowStartsPerYear }} 本</p>
      </article>
    </section>

    <section v-if="totalBorrowStartCount > 0" class="statistics-card statistics-card-spaced" aria-labelledby="borrowing-trend-title">
      <div class="statistics-header">
        <div>
          <p class="section-label">Borrowing Trend</p>
          <h2 id="borrowing-trend-title" class="statistics-title">借閱書籍趨勢</h2>
          <p class="statistics-copy">
            依年份統計借閱書籍數量
            <span v-if="topBorrowingYear">，最高的是 {{ topBorrowingYear.year }} 年（{{ topBorrowingYear.count }} 本）</span>
          </p>
        </div>
      </div>

      <div class="statistics-grid">
        <div class="bar-chart-shell" role="img" aria-label="借閱書籍趨勢長條圖">
          <div class="bar-chart">
            <Bar :data="borrowingTrendChartData" :options="borrowingTrendChartOptions" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="totalBorrowStartCount > 0" class="statistics-card statistics-card-spaced" aria-labelledby="category-distribution-title">
      <div class="statistics-header">
        <div>
          <p class="section-label">Category Distribution</p>
          <h2 id="category-distribution-title" class="statistics-title">分類分布</h2>
          <p class="statistics-copy">
            以借閱書籍數量統計分類
            <span v-if="topCategory">，目前最多的是 {{ topCategory.category }}（{{ topCategory.count }} 本）</span>
          </p>
        </div>
      </div>

      <div class="statistics-grid">
        <div class="pie-chart-shell" role="img" aria-label="分類分布圓餅圖">
          <div class="pie-chart">
            <Pie :key="chartLayoutKey" :data="categoryChartData" :options="categoryChartOptions" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="totalBorrowStartCount > 0" class="statistics-card statistics-card-spaced" aria-labelledby="author-exploration-title">
      <div class="statistics-header">
        <div>
          <p class="section-label">Author Exploration</p>
          <h2 id="author-exploration-title" class="statistics-title">作者探索趨勢</h2>
          <p class="statistics-copy">
            每年統計接觸的作者數與首次接觸的新作者數
            <span v-if="topAuthorExplorationYear">，{{ topAuthorExplorationYear.year }} 年最廣，接觸 {{ topAuthorExplorationYear.uniqueAuthors }} 位作者</span>
          </p>
        </div>
      </div>

      <div class="statistics-grid">
        <div class="bar-chart-shell" role="img" aria-label="作者探索趨勢長條圖">
          <div class="bar-chart">
            <Bar :data="authorExplorationChartData" :options="authorExplorationChartOptions" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="seriesLaunchChartEntries.length > 0" class="statistics-card statistics-card-spaced" aria-labelledby="series-launch-title">
      <div class="statistics-header">
        <div>
          <p class="section-label">Series Launches</p>
          <h2 id="series-launch-title" class="statistics-title">系列集數排行</h2>
          <p class="statistics-copy">
            依系列總集數排序
            <span v-if="topSeries">，目前最多集的是 {{ topSeries.title }}（{{ topSeries.volumeCount }} 集）</span>
          </p>
        </div>
      </div>

      <div class="statistics-grid">
        <div class="bar-chart-shell" role="img" aria-label="系列集數排行長條圖">
          <div class="bar-chart bar-chart-tall">
            <Bar :data="seriesLaunchChartData" :options="seriesLaunchChartOptions" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="heatmapStats.length > 0" class="statistics-card statistics-card-spaced" aria-labelledby="density-calendar-title">
      <div class="statistics-header">
        <div>
          <p class="section-label">Borrowing Density</p>
          <h2 id="density-calendar-title" class="statistics-title">借書密度日曆</h2>
          <p class="statistics-copy">
            以年月熱度顯示借閱書籍數量分布
            <span v-if="highestDensityMonth">，最密集的是 {{ highestDensityMonth.monthKey }}（{{ highestDensityMonth.count }} 本）</span>
          </p>
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
          <div v-for="label in MONTH_LABELS" :key="label" class="heatmap-month-label">
            {{ label }}
          </div>

          <template v-for="year in heatmapStats" :key="year.year">
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

    <section v-if="categoryTimelineChartData.datasets.length > 0" class="statistics-card statistics-card-spaced" aria-labelledby="category-timeline-title">
      <div class="statistics-header">
        <div>
          <p class="section-label">Category Timeline</p>
          <h2 id="category-timeline-title" class="statistics-title">分類與年份堆疊圖</h2>
          <p class="statistics-copy">比較每年借閱書籍數量，以及主要分類在各年的結構變化。</p>
        </div>
      </div>

      <div class="statistics-grid">
        <div class="bar-chart-shell" role="img" aria-label="分類與年份堆疊長條圖">
          <div class="bar-chart">
            <Bar :data="categoryTimelineChartData" :options="categoryTimelineChartOptions" />
          </div>
        </div>
      </div>
    </section>

    <section v-else class="empty-state" aria-label="分析統計頁面空狀態">
      <h2 class="empty-title">目前沒有可分析的借書資料</h2>
      <p class="empty-copy">等 `generated/books.json` 有內容後，這裡會顯示借閱書籍趨勢、分類分布與借書密度分析。</p>
    </section>
  </AppLayout>
</template>
