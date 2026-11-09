<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

defineProps({
  author: { type: String, required: true },
  category: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  sort: { type: String, required: true },
  sortOptions: { type: Array, required: true },
  authorOptions: { type: Array, required: true },
  categoryOptions: { type: Array, required: true },
  activeCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update:author', 'update:category', 'update:startDate', 'update:endDate', 'update:sort', 'reset'])
const isExpanded = ref(false)
</script>

<template>
  <div class="filter-controls">
    <label class="filter-field filter-field--desktop">
      <span>類型</span>
      <select :value="category" class="control" @change="emit('update:category', $event.target.value)">
        <option value="">全部類型</option>
        <option v-for="option in categoryOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </label>

    <label class="filter-field filter-field--desktop">
      <span>作者</span>
      <select :value="author" class="control" @change="emit('update:author', $event.target.value)">
        <option value="">全部作者</option>
        <option v-for="option in authorOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </label>

    <button
      class="filter-toggle"
      type="button"
      :aria-expanded="isExpanded"
      aria-controls="advanced-filters"
      @click="isExpanded = !isExpanded"
    >
      <Icon icon="material-symbols:tune-rounded" aria-hidden="true" />
      <span class="filter-toggle-desktop">{{ isExpanded ? '收合條件' : '日期與更多條件' }}</span>
      <span class="filter-toggle-mobile">篩選</span>
      <span v-if="activeCount" class="filter-count">{{ activeCount }}</span>
    </button>

    <label class="filter-field filter-field--sort">
      <span>排序</span>
      <select :value="sort" class="control" @change="emit('update:sort', $event.target.value)">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </label>
  </div>

  <Transition name="disclosure">
    <div v-if="isExpanded" id="advanced-filters" class="filter-panel">
      <div class="filter-panel-grid">
        <label class="filter-field filter-field--mobile">
          <span>類型</span>
          <select :value="category" class="control" @change="emit('update:category', $event.target.value)">
            <option value="">全部類型</option>
            <option v-for="option in categoryOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>

        <label class="filter-field filter-field--mobile">
          <span>作者</span>
          <select :value="author" class="control" @change="emit('update:author', $event.target.value)">
            <option value="">全部作者</option>
            <option v-for="option in authorOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>

        <label class="filter-field">
          <span>起始借閱日期</span>
          <input :value="startDate" class="control" type="date" @input="emit('update:startDate', $event.target.value)" />
        </label>

        <label class="filter-field">
          <span>結束借閱日期</span>
          <input :value="endDate" class="control" type="date" @input="emit('update:endDate', $event.target.value)" />
        </label>
      </div>
      <button class="text-button" type="button" @click="emit('reset')">清除全部條件</button>
    </div>
  </Transition>
</template>
