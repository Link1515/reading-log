<script setup>
import { computed, reactive } from 'vue'
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

const filters = reactive({
  title: '',
  author: '',
  startDate: '',
  endDate: '',
  sort: 'date-desc',
})

function includesIgnoreCase(source, keyword) {
  return source.toLowerCase().includes(keyword.trim().toLowerCase())
}

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
  const titleKeyword = filters.title.trim()
  const authorKeyword = filters.author.trim()

  return books
    .filter((book) => {
      if (titleKeyword && !includesIgnoreCase(book.title, titleKeyword)) {
        return false
      }

      if (authorKeyword && !includesIgnoreCase(book.author, authorKeyword)) {
        return false
      }

      if (filters.startDate && book.readDate < filters.startDate) {
        return false
      }

      if (filters.endDate && book.readDate > filters.endDate) {
        return false
      }

      return true
    })
    .toSorted((left, right) => compareBooks(filters.sort, left, right))
})

const resultSummary = computed(() => {
  const count = filteredBooks.value.length
  return `共 ${count} 本書`
})

function resetFilters() {
  filters.title = ''
  filters.author = ''
  filters.startDate = ''
  filters.endDate = ''
  filters.sort = 'date-desc'
}
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">Personal Library</p>
      <h1>閱讀紀錄</h1>
      <p class="hero-copy">
        以靜態資料維護你的書單，快速搜尋、篩選並排序每一次閱讀紀錄。
      </p>
    </section>

    <BookFilters
      v-model:title="filters.title"
      v-model:author="filters.author"
      v-model:start-date="filters.startDate"
      v-model:end-date="filters.endDate"
      v-model:sort="filters.sort"
      :sort-options="sortOptions"
      :result-summary="resultSummary"
      @reset="resetFilters"
    />

    <BookList :books="filteredBooks" />
  </main>
</template>
