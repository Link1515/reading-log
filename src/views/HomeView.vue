<script setup>
import { computed, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import Fuse from 'fuse.js'
import BookFilters from '../components/BookFilters.vue'
import BookList from '../components/BookList.vue'
import books from '../data/generated/books.json'

const collator = new Intl.Collator('zh-Hant', {
  sensitivity: 'base',
  numeric: true,
})

const sortOptions = [
  { value: 'date-desc', label: '閱讀日期新到舊' },
  { value: 'date-asc', label: '閱讀日期舊到新' },
  { value: 'title-asc', label: '書名 A 到 Z' },
  { value: 'title-desc', label: '書名 Z 到 A' },
  { value: 'author-asc', label: '作者 A 到 Z' },
  { value: 'author-desc', label: '作者 Z 到 A' },
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
  .map(author => ({
    value: author,
    label: author,
  }))

const categoryOptions = [...new Set(books.map(book => book.category))]
  .toSorted((left, right) => collator.compare(left, right))
  .map(category => ({
    value: category,
    label: category,
  }))

const filters = reactive({
  keyword: '',
  author: '',
  category: '',
  startDate: '',
  endDate: '',
  sort: 'date-desc',
})

const uiState = reactive({
  showFilters: false,
})

const searchInputState = reactive({
  draftKeyword: '',
  isComposing: false,
})

function compareBooks(sortKey, left, right) {
  switch (sortKey) {
    case 'date-asc':
      return left.readDate.localeCompare(right.readDate)
    case 'title-asc':
      return collator.compare(left.title, right.title)
    case 'title-desc':
      return collator.compare(right.title, left.title)
    case 'author-asc':
      return collator.compare(left.author, right.author)
    case 'author-desc':
      return collator.compare(right.author, left.author)
    case 'date-desc':
    default:
      return right.readDate.localeCompare(left.readDate)
  }
}

const filteredBooks = computed(() => {
  const keyword = filters.keyword.trim()
  const searchResults = keyword ? fuse.search(keyword).map(result => result.item) : books

  return searchResults
    .filter(book => {
      if (filters.author && book.author !== filters.author) {
        return false
      }

      if (filters.category && book.category !== filters.category) {
        return false
      }

      if (filters.startDate && book.endReadDate < filters.startDate) {
        return false
      }

      if (filters.endDate && book.startReadDate > filters.endDate) {
        return false
      }

      return true
    })
    .toSorted((left, right) => compareBooks(filters.sort, left, right))
})

const resultSummary = computed(() => {
  const count = filteredBooks.value.reduce((total, book) => {
    if (book.type === 'series' && Array.isArray(book.volumes) && book.volumes.length > 0) {
      return total + book.volumes.length
    }

    return total + 1
  }, 0)

  return `共 ${count} 本書`
})

function syncKeyword(value) {
  searchInputState.draftKeyword = value

  if (!searchInputState.isComposing) {
    filters.keyword = value
  }
}

function handleCompositionStart() {
  searchInputState.isComposing = true
}

function handleCompositionEnd(event) {
  searchInputState.isComposing = false
  syncKeyword(event.target.value)
}

function resetFilters() {
  filters.keyword = ''
  searchInputState.draftKeyword = ''
  filters.author = ''
  filters.category = ''
  filters.startDate = ''
  filters.endDate = ''
  filters.sort = 'date-desc'
  uiState.showFilters = false
}
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">Personal Library</p>
      <h1>閱讀紀錄</h1>
      <p class="hero-copy">收藏每一次閱讀留下的痕跡</p>
    </section>

    <section class="search-panel" aria-label="搜尋與篩選">
      <div class="search-toolbar">
        <label class="search-shell" for="global-search">
          <div class="search-input-wrap">
            <input
              id="global-search"
              :value="searchInputState.isComposing ? searchInputState.draftKeyword : filters.keyword"
              class="search-input"
              type="search"
              placeholder="輸入關鍵字查詢"
              @compositionstart="handleCompositionStart"
              @compositionend="handleCompositionEnd"
              @input="syncKeyword($event.target.value)"
            />
            <Icon icon="material-symbols:search-rounded" class="search-input-icon" />
          </div>
        </label>
        <button
          class="collapse-toggle"
          type="button"
          :aria-expanded="uiState.showFilters"
          :aria-label="uiState.showFilters ? '收合條件調整' : '展開條件調整'"
          :title="uiState.showFilters ? '收合條件調整' : '展開條件調整'"
          aria-controls="search-filters-panel"
          @click="uiState.showFilters = !uiState.showFilters"
        >
          <Icon :icon="uiState.showFilters ? 'material-symbols:close-rounded' : 'material-symbols:tune-rounded'" class="collapse-icon" />
        </button>
      </div>

      <Transition name="collapse-panel">
        <div v-if="uiState.showFilters" id="search-filters-panel" class="search-collapse">
          <BookFilters
            v-model:author="filters.author"
            v-model:category="filters.category"
            v-model:start-date="filters.startDate"
            v-model:end-date="filters.endDate"
            v-model:sort="filters.sort"
            :author-options="authorOptions"
            :category-options="categoryOptions"
            :sort-options="sortOptions"
            @reset="resetFilters"
          />
        </div>
      </Transition>
    </section>

    <p class="search-summary list-summary">{{ resultSummary }}</p>

    <BookList :books="filteredBooks" :keyword="filters.keyword" />
  </main>
</template>
