<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  sort: {
    type: String,
    required: true,
  },
  sortOptions: {
    type: Array,
    required: true,
  },
  resultSummary: {
    type: String,
    required: true,
  },
})

const emit = defineEmits([
  'update:title',
  'update:author',
  'update:startDate',
  'update:endDate',
  'update:sort',
  'reset',
])
</script>

<template>
  <section class="filters-card">
    <div class="filters-header">
      <div>
        <p class="section-label">篩選與排序</p>
        <h2>快速找到你讀過的書</h2>
      </div>
      <p class="result-summary">{{ resultSummary }}</p>
    </div>

    <div class="filters-grid">
      <label class="field">
        <span>書名搜尋</span>
        <input
          :value="title"
          class="control"
          type="search"
          placeholder="輸入書名關鍵字"
          @input="emit('update:title', $event.target.value)"
        />
      </label>

      <label class="field">
        <span>作者搜尋</span>
        <input
          :value="author"
          class="control"
          type="search"
          placeholder="輸入作者名稱"
          @input="emit('update:author', $event.target.value)"
        />
      </label>

      <label class="field">
        <span>起始日期</span>
        <input
          :value="startDate"
          class="control"
          type="date"
          @input="emit('update:startDate', $event.target.value)"
        />
      </label>

      <label class="field">
        <span>結束日期</span>
        <input
          :value="endDate"
          class="control"
          type="date"
          @input="emit('update:endDate', $event.target.value)"
        />
      </label>

      <label class="field field-wide">
        <span>排序方式</span>
        <select
          :value="sort"
          class="control"
          @change="emit('update:sort', $event.target.value)"
        >
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <button class="reset-button" type="button" @click="emit('reset')">清除篩選</button>
    </div>
  </section>
</template>
