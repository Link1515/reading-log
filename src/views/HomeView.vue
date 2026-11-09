<script setup>
import { computed, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import Fuse from 'fuse.js'
import AppLayout from '../components/AppLayout.vue'
import BookFilters from '../components/BookFilters.vue'
import BookList from '../components/BookList.vue'
import books from '../data/generated/books.json'

const collator = new Intl.Collator('zh-Hant', { sensitivity: 'base', numeric: true })
const sortOptions = [
  { value: 'date-desc', label: '最新借閱' },
  { value: 'date-asc', label: '最早借閱' },
  { value: 'title-asc', label: '書名 A → Z' },
  { value: 'title-desc', label: '書名 Z → A' },
  { value: 'author-asc', label: '作者 A → Z' },
  { value: 'author-desc', label: '作者 Z → A' },
]

const fuse = new Fuse(books, {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'author', weight: 0.4 },
    { name: 'searchText', weight: 0.3 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 1,
})

const authorOptions = [...new Set(books.map(book => book.author))]
  .toSorted((left, right) => collator.compare(left, right))
  .map(author => ({ value: author, label: author }))
const categoryOptions = [...new Set(books.map(book => book.category))]
  .toSorted((left, right) => collator.compare(left, right))
  .map(category => ({ value: category, label: category }))

const filters = reactive({
  keyword: '',
  author: '',
  category: '',
  startDate: '',
  endDate: '',
  sort: 'date-desc',
})
const searchInputState = reactive({ draftKeyword: '', isComposing: false })

function compareBooks(sortKey, left, right) {
  switch (sortKey) {
    case 'date-asc': return left.readDate.localeCompare(right.readDate)
    case 'title-asc': return collator.compare(left.title, right.title)
    case 'title-desc': return collator.compare(right.title, left.title)
    case 'author-asc': return collator.compare(left.author, right.author)
    case 'author-desc': return collator.compare(right.author, left.author)
    case 'date-desc':
    default: return right.readDate.localeCompare(left.readDate)
  }
}

const filteredBooks = computed(() => {
  const keyword = filters.keyword.trim()
  const searchResults = keyword ? fuse.search(keyword).map(result => result.item) : books

  return searchResults
    .filter(book => {
      if (filters.author && book.author !== filters.author) return false
      if (filters.category && book.category !== filters.category) return false
      if (filters.startDate && book.endReadDate < filters.startDate) return false
      if (filters.endDate && book.startReadDate > filters.endDate) return false
      return true
    })
    .toSorted((left, right) => compareBooks(filters.sort, left, right))
})

const bookCount = computed(() => filteredBooks.value.reduce((total, book) => (
  total + (book.type === 'series' && book.volumes.length ? book.volumes.length : 1)
), 0))

const activeFilters = computed(() => [
  filters.category && { key: 'category', label: '類型：' + filters.category },
  filters.author && { key: 'author', label: '作者：' + filters.author },
  filters.startDate && { key: 'startDate', label: '自 ' + filters.startDate },
  filters.endDate && { key: 'endDate', label: '至 ' + filters.endDate },
].filter(Boolean))

const hasInvalidDateRange = computed(() => (
  Boolean(filters.startDate && filters.endDate && filters.startDate > filters.endDate)
))
const isDateSort = computed(() => filters.sort.startsWith('date-'))
const groupedBooks = computed(() => {
  if (!filteredBooks.value.length) return []
  if (!isDateSort.value) return [{ key: 'all', label: '', books: filteredBooks.value }]

  const groups = new Map()
  for (const book of filteredBooks.value) {
    const year = book.readDate.slice(0, 4)
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(book)
  }
  return [...groups.entries()].map(([year, entries]) => ({ key: year, label: year, books: entries }))
})

function syncKeyword(value) {
  searchInputState.draftKeyword = value
  if (!searchInputState.isComposing) filters.keyword = value
}

function handleCompositionEnd(event) {
  searchInputState.isComposing = false
  syncKeyword(event.target.value)
}

function jumpToYear(year) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  document.getElementById('year-' + year)?.scrollIntoView({ behavior, block: 'start' })
}

function resetFilters() {
  filters.keyword = ''
  searchInputState.draftKeyword = ''
  filters.author = ''
  filters.category = ''
  filters.startDate = ''
  filters.endDate = ''
  filters.sort = 'date-desc'
}
</script>

<template>
  <AppLayout>
    <header class="page-intro">
      <h1>閱讀紀錄</h1>
      <p>收藏每一次閱讀留下的痕跡</p>
    </header>

    <section class="search-section" aria-label="搜尋與篩選">
      <label class="search-field" for="global-search">
        <Icon icon="material-symbols:search-rounded" aria-hidden="true" />
        <span class="sr-only">搜尋書名、作者或分集副標題</span>
        <input
          id="global-search"
          :value="searchInputState.isComposing ? searchInputState.draftKeyword : filters.keyword"
          type="search"
          placeholder="搜尋書名、作者或分集副標題"
          @compositionstart="searchInputState.isComposing = true"
          @compositionend="handleCompositionEnd"
          @input="syncKeyword($event.target.value)"
        />
      </label>

      <BookFilters
        v-model:author="filters.author"
        v-model:category="filters.category"
        v-model:start-date="filters.startDate"
        v-model:end-date="filters.endDate"
        v-model:sort="filters.sort"
        :author-options="authorOptions"
        :category-options="categoryOptions"
        :sort-options="sortOptions"
        :active-count="activeFilters.length"
        @reset="resetFilters"
      />
      <p v-if="hasInvalidDateRange" class="filter-error" role="alert">起始借閱日期不能晚於結束借閱日期，請調整日期範圍。</p>

      <div v-if="activeFilters.length" class="active-filters" aria-label="已套用的篩選條件">
        <span>已套用</span>
        <button
          v-for="filter in activeFilters"
          :key="filter.key"
          class="filter-chip"
          type="button"
          :aria-label="'移除' + filter.label"
          @click="filters[filter.key] = ''"
        >
          {{ filter.label }}
          <Icon icon="material-symbols:close-rounded" aria-hidden="true" />
        </button>
        <button class="text-button" type="button" @click="resetFilters">清除全部</button>
      </div>
    </section>

    <div class="result-bar" aria-live="polite">
      <p class="result-count">共 <strong>{{ bookCount }}</strong> 本書 <span>· {{ filteredBooks.length }} 筆紀錄</span></p>
      <nav v-if="isDateSort && groupedBooks.length > 1" class="year-jump" aria-label="快速跳至年份">
        <button v-for="group in groupedBooks" :key="group.key" type="button" @click="jumpToYear(group.label)">{{ group.label }}</button>
      </nav>
    </div>

    <BookList
      :groups="groupedBooks"
      :keyword="filters.keyword"
      :is-library-empty="books.length === 0"
      @reset="resetFilters"
    />
  </AppLayout>
</template>
