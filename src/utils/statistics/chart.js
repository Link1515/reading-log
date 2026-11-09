import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'

import { CATEGORY_COLORS, OTHER_COLOR } from './constants'
import { getPercentage } from './helpers'

let isChartRegistered = false

export function registerStatisticsCharts() {
  if (isChartRegistered) {
    return
  }

  ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)
  isChartRegistered = true
}

function createTooltipStyle() {
  return {
    backgroundColor: '#202836',
    borderColor: '#344151',
    borderWidth: 1,
    displayColors: true,
  }
}

export function createBaseVerticalBarOptions(isMobileLayout) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 220,
    },
    scales: {
      x: {
        ticks: {
          color: '#a7b4c4',
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
          color: '#f3f5f5',
          precision: 0,
          font: {
            size: isMobileLayout ? 12 : 13,
          },
        },
        grid: {
          color: '#344151',
        },
        border: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#f3f5f5',
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: createTooltipStyle(),
    },
  }
}

export function createBaseHorizontalBarOptions(isMobileLayout) {
  const baseOptions = createBaseVerticalBarOptions(isMobileLayout)

  return {
    ...baseOptions,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: '#a7b4c4',
          precision: 0,
        },
        grid: {
          color: '#344151',
        },
        border: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: '#f3f5f5',
          font: {
            size: isMobileLayout ? 12 : 13,
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
  }
}

export function createBorrowingTrendChartOptions({ isMobileLayout, totalBorrowStartCount }) {
  const baseOptions = createBaseVerticalBarOptions(isMobileLayout)

  return {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        display: false,
      },
      tooltip: {
        ...baseOptions.plugins.tooltip,
        displayColors: false,
        callbacks: {
          label(context) {
            const value = Number(context.raw)
            const percentage = getPercentage(value, totalBorrowStartCount)
            return `${context.label}: ${value} 本 (${percentage}%)`
          },
        },
      },
    },
  }
}

export function createCategoryChartOptions({ isMobileLayout }) {
  const baseOptions = createBaseHorizontalBarOptions(isMobileLayout)

  return {
    ...baseOptions,
    layout: {
      padding: isMobileLayout ? 4 : 8,
    },
    plugins: {
      ...baseOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...baseOptions.plugins.tooltip,
        displayColors: false,
        callbacks: {
          label(context) {
            const value = Number(context.raw)
            const total = context.dataset.data.reduce((sum, count) => sum + Number(count), 0)
            return context.label + ': ' + value + ' 本 (' + getPercentage(value, total) + '%)'
          },
        },
      },
    },
    scales: {
      ...baseOptions.scales,
      y: {
        ...baseOptions.scales.y,
        ticks: {
          ...baseOptions.scales.y.ticks,
          autoSkip: false,
        },
      },
    },
  }
}

export function createAuthorExplorationChartOptions({ isMobileLayout }) {
  const baseOptions = createBaseVerticalBarOptions(isMobileLayout)

  return {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: {
          label(context) {
            return `${context.dataset.label}: ${Number(context.raw)} 位`
          },
        },
      },
    },
  }
}

export function createSeriesLaunchChartOptions({ isMobileLayout, seriesLaunchChartEntries }) {
  const baseOptions = createBaseHorizontalBarOptions(isMobileLayout)

  return {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        display: false,
      },
      tooltip: {
        ...baseOptions.plugins.tooltip,
        displayColors: false,
        callbacks: {
          label(context) {
            const sortedEntry = seriesLaunchChartEntries[context.dataIndex]
            return `${context.label}: ${Number(context.raw)} 集，起點 ${sortedEntry.startDate}`
          },
        },
      },
    },
    scales: {
      ...baseOptions.scales,
      x: {
        ...baseOptions.scales.x,
        title: {
          display: false,
        },
      },
      y: {
        ...baseOptions.scales.y,
        ticks: {
          ...baseOptions.scales.y.ticks,
          autoSkip: false,
        },
      },
    },
  }
}

export function createCategoryTimelineChartOptions({ isMobileLayout }) {
  const baseOptions = createBaseVerticalBarOptions(isMobileLayout)

  return {
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      x: {
        ...baseOptions.scales.x,
        stacked: true,
      },
      y: {
        ...baseOptions.scales.y,
        stacked: true,
      },
    },
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: {
          label(context) {
            const value = Number(context.raw)
            return `${context.dataset.label}: ${value} 本`
          },
        },
      },
    },
  }
}

export function createBorrowingTrendChartData(yearlyBorrowStats) {
  const highestCount = Math.max(...yearlyBorrowStats.map(entry => entry.count), 0)

  return {
    labels: yearlyBorrowStats.map(entry => entry.year),
    datasets: [
      {
        label: '借閱書籍數',
        data: yearlyBorrowStats.map(entry => entry.count),
        backgroundColor: yearlyBorrowStats.map(entry => entry.count === highestCount ? '#70c5be' : '#79b8ff'),
        borderWidth: 0,
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 44,
      },
    ],
  }
}

export function createCategoryChartData(categoryStats) {
  return {
    labels: categoryStats.map(entry => entry.category),
    datasets: [
      {
        label: '借閱書籍數',
        data: categoryStats.map(entry => entry.count),
        backgroundColor: categoryStats.map(entry => entry.color),
        borderWidth: 0,
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 30,
      },
    ],
  }
}

export function createAuthorExplorationChartData(authorExplorationStats) {
  return {
    labels: authorExplorationStats.map(entry => entry.year),
    datasets: [
      {
        label: '接觸的作者數',
        data: authorExplorationStats.map(entry => entry.uniqueAuthors),
        backgroundColor: '#79b8ff',
        borderWidth: 0,
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 38,
      },
      {
        label: '首次接觸的新作者',
        data: authorExplorationStats.map(entry => entry.newAuthors),
        backgroundColor: '#70c5be',
        borderWidth: 0,
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 38,
      },
    ],
  }
}

export function createSeriesLaunchChartData(seriesLaunchChartEntries, isMobileLayout) {
  const barThickness = isMobileLayout ? 18 : 24

  return {
    labels: seriesLaunchChartEntries.map(entry => entry.title),
    datasets: [
      {
        label: '系列總集數',
        data: seriesLaunchChartEntries.map(entry => entry.volumeCount),
        backgroundColor: seriesLaunchChartEntries.map(entry => entry.color),
        borderWidth: 0,
        borderRadius: 5,
        borderSkipped: false,
        barThickness,
        maxBarThickness: barThickness,
      },
    ],
  }
}

export function createCategoryTimelineChartData({ categoryStats, categoryYearlyStats, years }) {
  const visibleCategories = categoryStats
    .filter(entry => entry.category !== '其他')
    .map(entry => entry.category)

  const datasets = visibleCategories.map((category, index) => ({
    label: category,
    data: categoryYearlyStats.map(entry => entry.values[index] ?? 0),
    backgroundColor: categoryStats.find(entry => entry.category === category)?.color ?? CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    borderColor: '#171d27',
    borderWidth: 1,
    borderRadius: 3,
    borderSkipped: false,
    maxBarThickness: 42,
  }))

  if (categoryStats.some(entry => entry.category === '其他')) {
    datasets.push({
      label: '其他',
      data: categoryYearlyStats.map(entry => entry.other),
      backgroundColor: OTHER_COLOR,
      borderColor: '#171d27',
      borderWidth: 1,
      borderRadius: 0,
      borderSkipped: false,
      maxBarThickness: 42,
    })
  }

  return {
    labels: years,
    datasets,
  }
}
