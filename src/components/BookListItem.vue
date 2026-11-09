<script setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  book: { type: Object, required: true },
  keyword: { type: String, default: '' },
  headingLevel: { type: String, default: 'h3' },
})

const isExpanded = ref(false)
const isSeries = computed(() => props.book.type === 'series' && props.book.volumes.length > 0)
const normalizedKeyword = computed(() => props.keyword.trim().toLowerCase())
const shouldAutoExpand = computed(() => {
  if (!isSeries.value || !normalizedKeyword.value) return false
  return props.book.volumes.some(volume => volume.subtitle?.toLowerCase().includes(normalizedKeyword.value))
})
const dateLabel = computed(() => {
  if (!isSeries.value || props.book.startReadDate === props.book.endReadDate) return props.book.readDate
  return props.book.startReadDate + ' – ' + props.book.endReadDate
})

watch(shouldAutoExpand, (value) => {
  if (value) isExpanded.value = true
  else if (!normalizedKeyword.value) isExpanded.value = false
}, { immediate: true })
</script>

<template>
  <li class="book-list-item" :class="{ 'is-expanded': isExpanded }">
    <article class="book-entry">
      <div class="book-entry-copy">
        <component :is="headingLevel" class="book-title">{{ book.title }}</component>
        <p class="book-byline"><span>{{ book.author }}</span><span class="byline-divider" aria-hidden="true"></span><span>{{ book.category }}</span></p>
        <button
          v-if="isSeries"
          class="series-toggle"
          type="button"
          :aria-expanded="isExpanded"
          :aria-controls="'series-panel-' + book.id"
          @click="isExpanded = !isExpanded"
        >
          {{ isExpanded ? '收合' : '查看' }} {{ book.volumeCount }} 集
          <Icon icon="material-symbols:keyboard-arrow-down-rounded" class="series-toggle-icon" :class="{ 'is-expanded': isExpanded }" aria-hidden="true" />
        </button>
      </div>

      <div class="book-entry-date">
        <span>{{ isSeries ? '借閱區間' : '借閱日期' }}</span>
        <span v-if="isSeries" class="date-value">{{ dateLabel }}</span>
        <time v-else class="date-value" :datetime="book.readDate">{{ dateLabel }}</time>
      </div>
    </article>

    <Transition name="disclosure">
      <div v-if="isSeries && isExpanded" :id="'series-panel-' + book.id" class="series-panel">
        <ol class="volume-list" aria-label="分集清單">
          <li v-for="volume in book.volumes" :key="volume.id" class="volume-item">
            <div class="volume-copy">
              <span class="volume-number">第 {{ volume.volume }} 集</span>
              <span v-if="volume.subtitle" class="volume-subtitle">{{ volume.subtitle }}</span>
            </div>
            <time :datetime="volume.readDate">{{ volume.readDate }}</time>
          </li>
        </ol>
      </div>
    </Transition>
  </li>
</template>
