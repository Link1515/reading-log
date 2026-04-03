<script setup>
defineProps({
  book: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="book-card">
    <div class="book-meta">
      <span class="book-category">{{ book.category }}</span>
      <time :datetime="book.readDate">{{ book.readDate }}</time>
    </div>
    <h3>{{ book.title }}</h3>
    <p class="book-author">{{ book.author }}</p>
  </article>
</template>
