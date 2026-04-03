import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const rawPath = path.join(rootDir, 'src', 'data', 'raw', 'books.json')
const generatedDir = path.join(rootDir, 'src', 'data', 'generated')
const generatedPath = path.join(generatedDir, 'books.json')

const collator = new Intl.Collator('zh-Hant', {
  sensitivity: 'base',
  numeric: true,
})

function fail(message) {
  throw new Error(`[build-books] ${message}`)
}

function formatBookLabel(value, fallback) {
  return value && typeof value === 'string' && value.trim() ? `《${value.trim()}》` : fallback
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function normalizeStringField(record, key, label) {
  const value = record[key]

  if (typeof value !== 'string') {
    fail(`${label} 的 "${key}" 必須是非空字串`)
  }

  const normalized = value.trim()
  if (!normalized) {
    fail(`${label} 的 "${key}" 不可為空`)
  }

  return normalized
}

function createId(...parts) {
  const source = parts.join('|').normalize('NFKC').toLowerCase()
  let hash = 0

  for (const character of source) {
    hash = (hash * 31 + character.codePointAt(0)) >>> 0
  }

  return `book-${hash.toString(36).padStart(7, '0')}`
}

function sortBooks(a, b) {
  if (a.readDate !== b.readDate) {
    return b.readDate.localeCompare(a.readDate)
  }

  const authorOrder = collator.compare(a.author, b.author)
  if (authorOrder !== 0) {
    return authorOrder
  }

  return collator.compare(a.title, b.title)
}

function normalizeVolumeField(record, key, bookLabel, volumeLabel) {
  const value = record[key]

  if (typeof value !== 'string') {
    fail(`${bookLabel}${volumeLabel}的 "${key}" 必須是非空字串`)
  }

  const normalized = value.trim()
  if (!normalized) {
    fail(`${bookLabel}${volumeLabel}的 "${key}" 不可為空`)
  }

  return normalized
}

function normalizeOptionalVolumeField(record, key, bookLabel, volumeLabel) {
  if (!(key in record) || record[key] == null) {
    return ''
  }

  const value = record[key]

  if (typeof value !== 'string') {
    fail(`${bookLabel}${volumeLabel}的 "${key}" 必須是字串`)
  }

  return value.trim()
}

function normalizeSingleBook(record, index, duplicateMap) {
  const bookLabel = formatBookLabel(record.title, `第 ${index + 1} 筆資料`)
  const readDate = normalizeStringField(record, 'readDate', bookLabel)

  if (!isValidDateString(readDate)) {
    fail(`${bookLabel} 的 "readDate" 必須是合法的 YYYY-MM-DD`)
  }

  const title = normalizeStringField(record, 'title', bookLabel)
  const normalizedBookLabel = formatBookLabel(title, bookLabel)
  const author = normalizeStringField(record, 'author', normalizedBookLabel)
  const category = normalizeStringField(record, 'category', normalizedBookLabel)

  const duplicateKey = `single::${title}::${author}::${readDate}`
  if (duplicateMap.has(duplicateKey)) {
    fail(`偵測到重複資料：${normalizedBookLabel} 的 title、author、readDate 相同`)
  }

  duplicateMap.set(duplicateKey, index)

  return {
    id: createId('single', title, author, readDate),
    type: 'single',
    title,
    author,
    category,
    readDate,
    startReadDate: readDate,
    endReadDate: readDate,
    readYear: readDate.slice(0, 4),
    readMonth: readDate.slice(5, 7),
    searchText: `${title} ${author}`.toLowerCase(),
    volumes: [],
  }
}

function normalizeSeriesBook(record, index, duplicateMap) {
  const bookLabel = formatBookLabel(record.title, `第 ${index + 1} 筆資料`)
  const title = normalizeStringField(record, 'title', bookLabel)
  const normalizedBookLabel = formatBookLabel(title, bookLabel)
  const author = normalizeStringField(record, 'author', normalizedBookLabel)
  const category = normalizeStringField(record, 'category', normalizedBookLabel)
  const { volumes } = record

  if ('readDate' in record) {
    fail(`${normalizedBookLabel} 不可同時包含 "readDate" 與 "volumes"`)
  }

  if (!Array.isArray(volumes) || volumes.length === 0) {
    fail(`${normalizedBookLabel} 的 "volumes" 必須是非空陣列`)
  }

  const duplicateSeriesKey = `series::${title}::${author}`
  if (duplicateMap.has(duplicateSeriesKey)) {
    fail(`偵測到重複系列資料：${normalizedBookLabel} 的 title、author 相同`)
  }

  duplicateMap.set(duplicateSeriesKey, index)

  const seenVolumes = new Map()
  const normalizedVolumes = volumes.map((volumeRecord, volumeIndex) => {
    if (!volumeRecord || typeof volumeRecord !== 'object' || Array.isArray(volumeRecord)) {
      fail(`${normalizedBookLabel} 第 ${volumeIndex + 1} 集必須是物件`)
    }

    const volumeLabel = ` 第 ${volumeIndex + 1} 集`
    const volume = normalizeVolumeField(volumeRecord, 'volume', normalizedBookLabel, volumeLabel)
    const subtitle = normalizeOptionalVolumeField(volumeRecord, 'subtitle', normalizedBookLabel, volumeLabel)
    const readDate = normalizeVolumeField(volumeRecord, 'readDate', normalizedBookLabel, volumeLabel)

    if (!isValidDateString(readDate)) {
      fail(`${normalizedBookLabel}${volumeLabel}的 "readDate" 必須是合法的 YYYY-MM-DD`)
    }

    const duplicateVolumeKey = `${volume}::${subtitle}`
    if (seenVolumes.has(duplicateVolumeKey)) {
      fail(`${normalizedBookLabel} 的分集資料重複：volume "${volume}" 與 subtitle "${subtitle}" 相同`)
    }

    seenVolumes.set(duplicateVolumeKey, volumeIndex)

    return {
      id: createId('series-volume', title, author, volume, subtitle, readDate),
      volume,
      subtitle,
      readDate,
      title: subtitle ? `${title}. ${volume}, ${subtitle}` : `${title}. ${volume}`,
      searchText: `${title} ${author} ${volume} ${subtitle}`.trim().toLowerCase(),
    }
  })

  const readDates = normalizedVolumes.map((volume) => volume.readDate)
  const startReadDate = [...readDates].sort((left, right) => left.localeCompare(right))[0]
  const endReadDate = [...readDates].sort((left, right) => right.localeCompare(left))[0]

  return {
    id: createId('series', title, author),
    type: 'series',
    title,
    author,
    category,
    readDate: endReadDate,
    startReadDate,
    endReadDate,
    readYear: endReadDate.slice(0, 4),
    readMonth: endReadDate.slice(5, 7),
    volumeCount: normalizedVolumes.length,
    searchText: `${title} ${author} ${normalizedVolumes
      .map((volume) => `${volume.volume} ${volume.subtitle}`)
      .join(' ')}`.toLowerCase(),
    volumes: normalizedVolumes,
  }
}

async function main() {
  const rawContent = await readFile(rawPath, 'utf8')
  let parsed

  try {
    parsed = JSON.parse(rawContent)
  } catch (error) {
    fail(`無法解析 raw/books.json: ${error.message}`)
  }

  if (!Array.isArray(parsed)) {
    fail('raw/books.json 的根節點必須是陣列')
  }

  const duplicateMap = new Map()
  const normalizedBooks = parsed.map((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      const bookLabel = formatBookLabel(record?.title, `第 ${index + 1} 筆資料`)
      fail(`${bookLabel} 必須是物件`)
    }

    const hasVolumes = 'volumes' in record
    const hasReadDate = 'readDate' in record

    if (hasVolumes) {
      return normalizeSeriesBook(record, index, duplicateMap)
    }

    if (hasReadDate) {
      return normalizeSingleBook(record, index, duplicateMap)
    }

    const bookLabel = formatBookLabel(record.title, `第 ${index + 1} 筆資料`)
    fail(`${bookLabel} 必須包含 "readDate" 或 "volumes"`)
  })

  normalizedBooks.sort(sortBooks)

  await mkdir(generatedDir, { recursive: true })
  await writeFile(generatedPath, `${JSON.stringify(normalizedBooks, null, 2)}\n`, 'utf8')
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
