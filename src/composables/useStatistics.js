import { computed } from 'vue'

import { MONTH_LABELS, CATEGORY_COLORS, MAX_TOP_SERIES, MAX_VISIBLE_CATEGORIES, OTHER_COLOR, SERIES_COLORS } from '../utils/statistics/constants'
import { buildCountMap, formatMonthKey, getPercentage } from '../utils/statistics/helpers'
import {
  createAuthorExplorationChartData,
  createAuthorExplorationChartOptions,
  createBorrowingTrendChartData,
  createBorrowingTrendChartOptions,
  createCategoryChartData,
  createCategoryChartOptions,
  createCategoryTimelineChartData,
  createCategoryTimelineChartOptions,
  createSeriesLaunchChartData,
  createSeriesLaunchChartOptions,
  registerStatisticsCharts,
} from '../utils/statistics/chart'

registerStatisticsCharts()

export function useStatistics(rawBooks, viewport) {
  const books = Array.isArray(rawBooks) ? rawBooks : []

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
  const averageBorrowStartsPerYear = computed(() => {
    if (years.value.length === 0) {
      return '0.0'
    }

    return (totalBorrowStartCount.value / years.value.length).toFixed(1)
  })

  const summaryTiles = computed(() => [
    {
      label: 'Borrow Starts',
      value: totalBorrowStartCount.value,
      copy: '總借閱書籍數量',
    },
    {
      label: 'Categories',
      value: totalCategoryCount.value,
      copy: `涵蓋 ${totalCategoryCount.value} 種分類`,
    },
    {
      label: 'Authors',
      value: totalAuthorCount.value,
      copy: `接觸過 ${totalAuthorCount.value} 位作者`,
    },
    {
      label: 'Average Per Year',
      value: averageBorrowStartsPerYear.value,
      copy: `平均每年借閱 ${averageBorrowStartsPerYear.value} 本`,
    },
  ])

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
      color: SERIES_COLORS[index % SERIES_COLORS.length],
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

  const borrowingTrendChartData = computed(() => createBorrowingTrendChartData(yearlyBorrowStats.value))
  const categoryChartData = computed(() => createCategoryChartData(categoryStats.value))
  const authorExplorationChartData = computed(() => createAuthorExplorationChartData(authorExplorationStats.value))
  const seriesLaunchChartData = computed(() => createSeriesLaunchChartData(seriesLaunchChartEntries.value, viewport.isMobileLayout.value))
  const categoryTimelineChartData = computed(() => createCategoryTimelineChartData({
    categoryStats: categoryStats.value,
    categoryYearlyStats: categoryYearlyStats.value,
    years: years.value,
  }))

  const borrowingTrendChartOptions = computed(() => createBorrowingTrendChartOptions({
    isMobileLayout: viewport.isMobileLayout.value,
    totalBorrowStartCount: totalBorrowStartCount.value,
  }))
  const categoryChartOptions = computed(() => createCategoryChartOptions({
    isMobileLayout: viewport.isMobileLayout.value,
  }))
  const authorExplorationChartOptions = computed(() => createAuthorExplorationChartOptions({
    isMobileLayout: viewport.isMobileLayout.value,
  }))
  const seriesLaunchChartOptions = computed(() => createSeriesLaunchChartOptions({
    isMobileLayout: viewport.isMobileLayout.value,
    seriesLaunchChartEntries: seriesLaunchChartEntries.value,
  }))
  const categoryTimelineChartOptions = computed(() => createCategoryTimelineChartOptions({
    isMobileLayout: viewport.isMobileLayout.value,
  }))

  const hasBorrowData = computed(() => totalBorrowStartCount.value > 0)
  const hasSeriesData = computed(() => seriesLaunchChartEntries.value.length > 0)
  const hasHeatmapData = computed(() => heatmapStats.value.length > 0)
  const hasCategoryTimelineData = computed(() => categoryTimelineChartData.value.datasets.length > 0)

  return {
    MONTH_LABELS,
    chartLayoutKey: viewport.chartLayoutKey,
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
    seriesLaunchChartEntries,
    topSeries,
    seriesLaunchChartData,
    seriesLaunchChartOptions,
    heatmapStats,
    highestDensityMonth,
    categoryTimelineChartData,
    categoryTimelineChartOptions,
  }
}
