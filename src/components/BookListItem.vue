<script setup>
defineProps({
  book: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <li class="book-list-item">
    <article class="book-entry">
      <div class="book-entry-main">
        <h3>{{ book.title }}</h3>
        <p class="book-author">{{ book.author }}</p>
      </div>

      <div class="book-meta">
        <span class="book-category">{{ book.category }}</span>
        <time :datetime="book.readDate">{{ book.readDate }}</time>
      </div>
    </article>
  </li>
</template>
