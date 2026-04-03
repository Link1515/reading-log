<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
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

const filters = reactive({
  keyword: '',
  startDate: '',
  endDate: '',
  sort: 'date-desc',
})

const uiState = reactive({
  showSearch: false,
  showFilters: false,
})

const searchInput = ref(null)

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
  const searchResults = keyword ? fuse.search(keyword).map((result) => result.item) : books

  return searchResults
    .filter((book) => {
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

const activeKeyword = computed(() => filters.keyword.trim())

function resetFilters() {
  filters.keyword = ''
  filters.startDate = ''
  filters.endDate = ''
  filters.sort = 'date-desc'
  uiState.showFilters = false
}

async function openSearch() {
  uiState.showSearch = true
  await nextTick()
  searchInput.value?.focus()
}

function closeSearch() {
  uiState.showSearch = false
  uiState.showFilters = false
}

function handleSearchEscape(event) {
  if (event.key !== 'Escape') {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  closeSearch()
}

function handleGlobalKeydown(event) {
  const target = event.target
  const isTypingTarget =
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable)

  if (event.key === '/' && !isTypingTarget) {
    event.preventDefault()
    openSearch()
  }

  if (event.key === 'Escape' && uiState.showSearch) {
    closeSearch()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <main class="page-shell">
    <button
      class="mobile-search-trigger"
      type="button"
      aria-label="開啟搜尋"
      title="開啟搜尋"
      @click="openSearch"
    >
      <Icon icon="material-symbols:search-rounded" class="mobile-search-icon" />
      <span class="search-trigger-tooltip">
        按 <kbd>/</kbd> 開啟搜尋，按 <kbd>Esc</kbd> 關閉
      </span>
    </button>

    <Transition name="search-backdrop-fade">
      <button
        v-if="uiState.showSearch"
        class="search-backdrop"
        type="button"
        aria-label="關閉搜尋"
        @click="closeSearch"
      />
    </Transition>

    <Transition name="search-dock-fade">
      <section v-if="uiState.showSearch" class="search-dock">
        <label class="search-shell" for="global-search">
          <span class="search-label">搜尋書名或作者</span>
          <input
            id="global-search"
            ref="searchInput"
            :value="filters.keyword"
            class="search-input"
            type="search"
            placeholder="直接輸入關鍵字，例如：Cal Newport 或 原子習慣"
            @input="filters.keyword = $event.target.value"
            @keydown="handleSearchEscape"
          />
        </label>
        <div class="search-toolbar">
          <button
            class="collapse-toggle"
            type="button"
            :aria-expanded="uiState.showFilters"
            :aria-label="uiState.showFilters ? '收合條件調整' : '展開條件調整'"
            :title="uiState.showFilters ? '收合條件調整' : '展開條件調整'"
            aria-controls="search-filters-panel"
            @click="uiState.showFilters = !uiState.showFilters"
          >
            <Icon
              :icon="uiState.showFilters ? 'material-symbols:close-rounded' : 'material-symbols:tune-rounded'"
              class="collapse-icon"
            />
          </button>
        </div>

        <Transition name="collapse-panel">
          <div
            v-if="uiState.showFilters"
            id="search-filters-panel"
            class="search-collapse"
          >
            <BookFilters
              v-model:start-date="filters.startDate"
              v-model:end-date="filters.endDate"
              v-model:sort="filters.sort"
              :sort-options="sortOptions"
              @reset="resetFilters"
            />
          </div>
        </Transition>
      </section>
    </Transition>

    <section class="hero">
      <p class="eyebrow">Personal Library</p>
      <h1>閱讀紀錄</h1>
      <p class="hero-copy">
        以靜態資料維護你的書單，快速搜尋、篩選並排序每一次閱讀紀錄。
      </p>
    </section>

    <section v-if="activeKeyword" class="active-search" aria-label="目前搜尋條件">
      <p class="active-search-label">目前搜尋</p>
      <p class="active-search-keyword">「{{ activeKeyword }}」</p>
    </section>

    <p class="search-summary list-summary">{{ resultSummary }}</p>

    <BookList :books="filteredBooks" :keyword="filters.keyword" />
  </main>
</template>
