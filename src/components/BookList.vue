<script setup>
import { Icon } from '@iconify/vue'
import BookListItem from './BookListItem.vue'

defineProps({
  groups: { type: Array, required: true },
  keyword: { type: String, default: '' },
  isLibraryEmpty: { type: Boolean, default: false },
})

const emit = defineEmits(['reset'])
</script>

<template>
  <section class="list-section" aria-label="書籍清單">
    <template v-if="groups.length">
      <section
        v-for="group in groups"
        :id="group.label ? 'year-' + group.label : undefined"
        :key="group.key"
        class="year-section"
        :aria-label="group.label ? group.label + ' 年' : undefined"
      >
        <h2 v-if="group.label" class="year-heading"><span>{{ group.label }}</span></h2>
        <ul class="book-list">
          <BookListItem
            v-for="book in group.books"
            :key="book.id"
            :book="book"
            :keyword="keyword"
            :heading-level="group.label ? 'h3' : 'h2'"
          />
        </ul>
      </section>
    </template>

    <div v-else class="empty-state">
      <Icon icon="material-symbols:menu-book-outline-rounded" class="empty-icon" aria-hidden="true" />
      <h2 class="empty-title">{{ isLibraryEmpty ? '目前尚無閱讀紀錄' : '找不到符合條件的書籍' }}</h2>
      <p class="empty-copy">{{ isLibraryEmpty ? '新增書籍資料後，閱讀紀錄會顯示在這裡。' : '試著調整關鍵字或篩選條件，再看看其他書籍。' }}</p>
      <button v-if="!isLibraryEmpty" class="primary-button" type="button" @click="emit('reset')">清除搜尋與篩選</button>
    </div>
  </section>
</template>
