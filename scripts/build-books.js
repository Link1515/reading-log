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

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function normalizeStringField(record, key, index) {
  const value = record[key]

  if (typeof value !== 'string') {
    fail(`第 ${index + 1} 筆資料的 "${key}" 必須是非空字串`)
  }

  const normalized = value.trim()
  if (!normalized) {
    fail(`第 ${index + 1} 筆資料的 "${key}" 不可為空`)
  }

  return normalized
}

function createId({ title, author, readDate }) {
  const source = `${title}|${author}|${readDate}`.normalize('NFKC').toLowerCase()
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
      fail(`第 ${index + 1} 筆資料必須是物件`)
    }

    const title = normalizeStringField(record, 'title', index)
    const author = normalizeStringField(record, 'author', index)
    const category = normalizeStringField(record, 'category', index)
    const readDate = normalizeStringField(record, 'readDate', index)

    if (!isValidDateString(readDate)) {
      fail(`第 ${index + 1} 筆資料的 "readDate" 必須是合法的 YYYY-MM-DD`)
    }

    const duplicateKey = `${title}::${author}::${readDate}`
    if (duplicateMap.has(duplicateKey)) {
      const previousIndex = duplicateMap.get(duplicateKey)
      fail(`偵測到重複資料：第 ${previousIndex + 1} 筆與第 ${index + 1} 筆的 title、author、readDate 相同`)
    }

    duplicateMap.set(duplicateKey, index)

    return {
      id: createId({ title, author, readDate }),
      title,
      author,
      category,
      readDate,
      readYear: readDate.slice(0, 4),
      readMonth: readDate.slice(5, 7),
      searchText: `${title} ${author}`.toLowerCase(),
    }
  })

  normalizedBooks.sort(sortBooks)

  await mkdir(generatedDir, { recursive: true })
  await writeFile(generatedPath, `${JSON.stringify(normalizedBooks, null, 2)}\n`, 'utf8')
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
