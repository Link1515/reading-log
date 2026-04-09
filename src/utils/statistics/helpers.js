export function formatMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function getPercentage(value, total) {
  return total === 0 ? '0.0' : ((value / total) * 100).toFixed(1)
}

export function buildCountMap(items, keyGetter) {
  const countMap = new Map()

  for (const item of items) {
    const key = keyGetter(item)
    countMap.set(key, (countMap.get(key) ?? 0) + 1)
  }

  return countMap
}
