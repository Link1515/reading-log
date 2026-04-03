<script setup>
import BookListItem from './BookListItem.vue'

defineProps({
  books: {
    type: Array,
    required: true,
  },
  keyword: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="list-section">
    <ul v-if="books.length" class="book-list" aria-label="書籍清單">
      <BookListItem v-for="book in books" :key="book.id" :book="book" :keyword="keyword" />
    </ul>

    <div v-else class="empty-state">
      <p class="empty-title">找不到符合條件的書籍</p>
      <p class="empty-copy">請調整搜尋關鍵字、作者、類型、日期區間，或清除目前篩選條件。</p>
    </div>
  </section>
</template>
