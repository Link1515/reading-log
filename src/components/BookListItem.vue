<script setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
  keyword: {
    type: String,
    default: '',
  },
})

const isExpanded = ref(false)

const isSeries = computed(() => props.book.type === 'series' && props.book.volumes.length > 0)
const normalizedKeyword = computed(() => props.keyword.trim().toLowerCase())
const shouldAutoExpand = computed(() => {
  if (!isSeries.value || !normalizedKeyword.value) {
    return false
  }

  return props.book.volumes.some((volume) =>
    volume.subtitle?.toLowerCase().includes(normalizedKeyword.value),
  )
})
const dateLabel = computed(() => {
  if (!isSeries.value || props.book.startReadDate === props.book.endReadDate) {
    return props.book.readDate
  }

  return `${props.book.startReadDate} - ${props.book.endReadDate}`
})

const volumeSummary = computed(() => {
  if (!isSeries.value) {
    return ''
  }

  return `共 ${props.book.volumeCount} 集`
})

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

watch(
  shouldAutoExpand,
  (value) => {
    if (value) {
      isExpanded.value = true
      return
    }

    if (!normalizedKeyword.value) {
      isExpanded.value = false
    }
  },
  { immediate: true },
)

</script>

<template>
  <li class="book-list-item" :class="{ 'is-series': isSeries, 'is-expanded': isExpanded }">
    <article class="book-entry">
      <div class="book-entry-main">
        <h3>{{ book.title }}</h3>
        <p class="book-author">{{ book.author }}</p>
        <p v-if="isSeries" class="book-series-summary">{{ volumeSummary }}</p>
      </div>

      <div class="book-meta">
        <span class="book-category">{{ book.category }}</span>
        <time :datetime="book.endReadDate">{{ dateLabel }}</time>
      </div>

      <button
        v-if="isSeries"
        class="series-toggle"
        type="button"
        :aria-expanded="isExpanded"
        :aria-label="isExpanded ? '收合集數' : '展開集數'"
        :title="isExpanded ? '收合集數' : '展開集數'"
        :aria-controls="`series-panel-${book.id}`"
        @click="toggleExpanded"
      >
        <Icon
          icon="material-symbols:keyboard-arrow-down-rounded"
          class="series-toggle-icon"
          :class="{ 'is-expanded': isExpanded }"
        />
      </button>
    </article>

    <Transition name="volume-collapse">
      <div
        v-if="isSeries && isExpanded"
        :id="`series-panel-${book.id}`"
        class="series-panel"
      >
        <ol class="volume-list" aria-label="分集清單">
          <li v-for="volume in book.volumes" :key="volume.id" class="volume-item">
            <div class="volume-copy">
              <p class="volume-label">第 {{ volume.volume }} 集</p>
              <p v-if="volume.subtitle" class="volume-title">{{ volume.subtitle }}</p>
            </div>
            <time :datetime="volume.readDate">{{ volume.readDate }}</time>
          </li>
        </ol>
      </div>
    </Transition>
  </li>
</template>
