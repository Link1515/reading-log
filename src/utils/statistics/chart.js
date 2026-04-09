import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'

import { CATEGORY_COLORS, OTHER_COLOR } from './constants'
import { getPercentage } from './helpers'

let isChartRegistered = false

export function registerStatisticsCharts() {
  if (isChartRegistered) {
    return
  }

  ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)
  isChartRegistered = true
}

function createTooltipStyle() {
  return {
    backgroundColor: 'rgba(20, 23, 29, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
            size: isMobileLayout ? 12 : 13,
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
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: isMobileLayout ? { top: 8, right: 8, bottom: 8, left: 8 } : { top: 8, right: 24, bottom: 8, left: 8 },
    },
    plugins: {
      legend: {
        display: true,
        position: isMobileLayout ? 'bottom' : 'right',
        align: 'center',
        labels: {
          color: '#ffffff',
          boxWidth: 12,
          boxHeight: 12,
          padding: isMobileLayout ? 16 : 18,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: isMobileLayout ? 13 : 14,
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
        ...createTooltipStyle(),
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
  return {
    labels: yearlyBorrowStats.map(entry => entry.year),
    datasets: [
      {
        label: '借書啟動數',
        data: yearlyBorrowStats.map(entry => entry.count),
        backgroundColor: 'rgba(96, 205, 255, 0.76)',
        borderColor: '#60cdff',
        borderWidth: 1,
        borderRadius: 10,
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
        data: categoryStats.map(entry => entry.count),
        backgroundColor: categoryStats.map(entry => entry.color),
        borderColor: 'rgba(18, 23, 34, 0.9)',
        borderWidth: 2,
        hoverOffset: 6,
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
        backgroundColor: 'rgba(79, 124, 255, 0.78)',
        borderColor: '#4f7cff',
        borderWidth: 1,
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 38,
      },
      {
        label: '首次接觸的新作者',
        data: authorExplorationStats.map(entry => entry.newAuthors),
        backgroundColor: 'rgba(34, 211, 238, 0.72)',
        borderColor: '#22d3ee',
        borderWidth: 1,
        borderRadius: 10,
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
        borderColor: 'rgba(18, 23, 34, 0.9)',
        borderWidth: 1,
        borderRadius: 10,
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
    borderWidth: 0,
    borderRadius: 6,
    borderSkipped: false,
    maxBarThickness: 42,
  }))

  if (categoryStats.some(entry => entry.category === '其他')) {
    datasets.push({
      label: '其他',
      data: categoryYearlyStats.map(entry => entry.other),
      backgroundColor: OTHER_COLOR,
      borderWidth: 0,
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
