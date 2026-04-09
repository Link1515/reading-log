<script setup>
import { Bar, Pie } from 'vue-chartjs'

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
  chartLayoutKey,
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
</script>

<template>
  <AppLayout>
    <section class="hero">
      <p class="eyebrow">Borrowing Insights</p>
      <h1>分析統計</h1>
      <p class="hero-copy">以下圖表都以開始借書日期為準，呈現的是借閱啟動與選書偏好，不代表完讀時間。</p>
    </section>

    <StatisticsSummary v-if="hasBorrowData" :items="summaryTiles" />

    <StatisticsChartSection
      v-if="hasBorrowData"
      :chart-component="Bar"
      :chart-data="borrowingTrendChartData"
      :chart-options="borrowingTrendChartOptions"
      aria-label="借閱書籍趨勢長條圖"
      section-label="Borrowing Trend"
      title="借閱書籍趨勢"
      title-id="borrowing-trend-title"
      :copy="`依年份統計借閱書籍數量${topBorrowingYear ? `，最高的是 ${topBorrowingYear.year} 年（${topBorrowingYear.count} 本）` : ''}`"
    />

    <StatisticsChartSection
      v-if="hasBorrowData"
      :chart-component="Pie"
      :chart-data="categoryChartData"
      :chart-options="categoryChartOptions"
      :chart-key="chartLayoutKey"
      aria-label="分類分布圓餅圖"
      section-label="Category Distribution"
      title="分類分布"
      title-id="category-distribution-title"
      chart-shell-class="pie-chart-shell"
      chart-class="pie-chart"
      :copy="`以借閱書籍數量統計分類${topCategory ? `，目前最多的是 ${topCategory.category}（${topCategory.count} 本）` : ''}`"
    />

    <StatisticsChartSection
      v-if="hasBorrowData"
      :chart-component="Bar"
      :chart-data="authorExplorationChartData"
      :chart-options="authorExplorationChartOptions"
      aria-label="作者探索趨勢長條圖"
      section-label="Author Exploration"
      title="作者探索趨勢"
      title-id="author-exploration-title"
      :copy="`每年統計接觸的作者數與首次接觸的新作者數${topAuthorExplorationYear ? `，${topAuthorExplorationYear.year} 年最廣，接觸 ${topAuthorExplorationYear.uniqueAuthors} 位作者` : ''}`"
    />

    <StatisticsChartSection
      v-if="hasSeriesData"
      :chart-component="Bar"
      :chart-data="seriesLaunchChartData"
      :chart-options="seriesLaunchChartOptions"
      aria-label="系列集數排行長條圖"
      section-label="Series Launches"
      title="系列集數排行"
      title-id="series-launch-title"
      chart-class="bar-chart bar-chart-tall"
      :copy="`依系列總集數排序${topSeries ? `，目前最多集的是 ${topSeries.title}（${topSeries.volumeCount} 集）` : ''}`"
    />

    <StatisticsHeatmapSection
      v-if="hasHeatmapData"
      title-id="density-calendar-title"
      section-label="Borrowing Density"
      title="借書密度日曆"
      :copy="`以年月熱度顯示借閱書籍數量分布${highestDensityMonth ? `，最密集的是 ${highestDensityMonth.monthKey}（${highestDensityMonth.count} 本）` : ''}`"
      :month-labels="MONTH_LABELS"
      :years="heatmapStats"
    />

    <StatisticsChartSection
      v-if="hasCategoryTimelineData"
      :chart-component="Bar"
      :chart-data="categoryTimelineChartData"
      :chart-options="categoryTimelineChartOptions"
      aria-label="分類與年份堆疊長條圖"
      section-label="Category Timeline"
      title="分類與年份堆疊圖"
      title-id="category-timeline-title"
      copy="比較每年借閱書籍數量，以及主要分類在各年的結構變化。"
    />

    <section v-if="!hasBorrowData" class="empty-state" aria-label="分析統計頁面空狀態">
      <h2 class="empty-title">目前沒有可分析的借書資料</h2>
      <p class="empty-copy">等 `generated/books.json` 有內容後，這裡會顯示借閱書籍趨勢、分類分布與借書密度分析。</p>
    </section>
  </AppLayout>
</template>
