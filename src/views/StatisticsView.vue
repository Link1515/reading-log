<script setup>
import { Bar } from 'vue-chartjs'
import StatisticsChartSection from '../components/statistics/StatisticsChartSection.vue'
import StatisticsHeatmapSection from '../components/statistics/StatisticsHeatmapSection.vue'
import StatisticsSummary from '../components/statistics/StatisticsSummary.vue'
import AppLayout from '../components/AppLayout.vue'
import { useStatistics } from '../composables/useStatistics'
import { useStatisticsViewport } from '../composables/useStatisticsViewport'
import books from '../data/generated/books.json'

const viewport = useStatisticsViewport()
const {
  MONTH_LABELS,
  hasBorrowData,
  hasSeriesData,
  hasHeatmapData,
  hasCategoryTimelineData,
  summaryTiles,
  topBorrowingYear,
  borrowingTrendChartData,
  borrowingTrendChartOptions,
  topCategory,
  categoryChartData,
  categoryChartOptions,
  topAuthorExplorationYear,
  authorExplorationChartData,
  authorExplorationChartOptions,
  topSeries,
  seriesLaunchChartData,
  seriesLaunchChartOptions,
  heatmapStats,
  highestDensityMonth,
  categoryTimelineChartData,
  categoryTimelineChartOptions,
} = useStatistics(books, viewport)

function jumpToSection(id) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' })
}
</script>

<template>
  <AppLayout>
    <header class="page-intro">
      <h1>統計</h1>
      <p>依書籍借閱日期整理這份紀錄，呈現借閱時間與選書偏好；不代表讀畢時間。</p>
    </header>

    <section v-if="hasBorrowData" class="stats-overview" aria-label="借閱書籍摘要">
      <div v-if="topBorrowingYear" class="peak-insight">
        <p>借閱最多的一年</p>
        <strong>{{ topBorrowingYear.year }} · {{ topBorrowingYear.count }} 本</strong>
      </div>
      <StatisticsSummary :items="summaryTiles" />
    </section>

    <StatisticsChartSection
      v-if="hasBorrowData"
      :chart-component="Bar"
      :chart-data="borrowingTrendChartData"
      :chart-options="borrowingTrendChartOptions"
      aria-label="各年借閱書籍數量長條圖"
      title="年度借閱趨勢"
      title-id="borrowing-trend"
      :copy="topBorrowingYear ? '以各集或單本書的借閱日期統計；' + topBorrowingYear.year + ' 年最多，共 ' + topBorrowingYear.count + ' 本。' : '以各集或單本書的借閱日期統計。'"
    />

    <nav v-if="hasBorrowData" class="stats-section-nav" aria-label="統計區塊快速跳轉">
      <button type="button" @click="jumpToSection('borrowing-trend')">時間</button>
      <button type="button" @click="jumpToSection('category-distribution')">類型</button>
      <button type="button" @click="jumpToSection('author-exploration')">作者</button>
      <button v-if="hasSeriesData" type="button" @click="jumpToSection('series-launch')">系列</button>
    </nav>

    <StatisticsChartSection
      v-if="hasBorrowData"
      :chart-component="Bar"
      :chart-data="categoryChartData"
      :chart-options="categoryChartOptions"
      aria-label="類型借閱書籍數量排行長條圖"
      title="類型分布"
      title-id="category-distribution"
      chart-class="bar-chart category-chart"
      :copy="topCategory ? '依借閱書籍數量計算；最多的是' + topCategory.category + '，共 ' + topCategory.count + ' 本。' : '依借閱書籍數量計算。'"
    />

    <StatisticsChartSection
      v-if="hasBorrowData"
      :chart-component="Bar"
      :chart-data="authorExplorationChartData"
      :chart-options="authorExplorationChartOptions"
      aria-label="每年接觸作者與新作者數量長條圖"
      title="作者探索"
      title-id="author-exploration"
      :copy="topAuthorExplorationYear ? topAuthorExplorationYear.year + ' 年接觸作者最多，共 ' + topAuthorExplorationYear.uniqueAuthors + ' 位。' : '每年接觸的作者數與首次接觸的新作者數。'"
    />

    <StatisticsChartSection
      v-if="hasSeriesData"
      :chart-component="Bar"
      :chart-data="seriesLaunchChartData"
      :chart-options="seriesLaunchChartOptions"
      aria-label="系列集數排行長條圖"
      title="系列集數排行"
      title-id="series-launch"
      chart-class="bar-chart bar-chart-tall"
      :copy="topSeries ? '依系列總集數排序；最多的是《' + topSeries.title + '》，共 ' + topSeries.volumeCount + ' 集。' : '依系列總集數排序。'"
    />

    <StatisticsHeatmapSection
      v-if="hasHeatmapData"
      title-id="density-calendar"
      title="每月借閱密度"
      :copy="highestDensityMonth ? '每格代表一個月；' + highestDensityMonth.monthKey + ' 最多，共 ' + highestDensityMonth.count + ' 本。' : '每格代表一個月的借閱書籍數量。'"
      :month-labels="MONTH_LABELS"
      :years="heatmapStats"
    />

    <StatisticsChartSection
      v-if="hasCategoryTimelineData"
      :chart-component="Bar"
      :chart-data="categoryTimelineChartData"
      :chart-options="categoryTimelineChartOptions"
      aria-label="各年類型分布堆疊長條圖"
      title="類型與年份"
      title-id="category-timeline"
      copy="比較每年的借閱書籍數，以及主要類型如何變化。"
    />

    <section v-if="!hasBorrowData" class="empty-state" aria-label="統計空狀態">
      <h2 class="empty-title">目前沒有可分析的書籍資料</h2>
      <p class="empty-copy">新增書籍資料後，這裡會顯示借閱趨勢、類型分布與每月密度。</p>
    </section>
  </AppLayout>
</template>
