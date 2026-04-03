<script setup>
defineProps({
  author: {
    type: String,
    required: true,
  },
  category: {
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
  authorOptions: {
    type: Array,
    required: true,
  },
  categoryOptions: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:author', 'update:category', 'update:startDate', 'update:endDate', 'update:sort', 'reset'])
</script>

<template>
  <section class="filters-card">
    <div class="filters-header">
      <div>
        <p class="section-label">條件調整</p>
      </div>
    </div>

    <div class="filters-grid">
      <label class="field">
        <span>作者</span>
        <select :value="author" class="control" @change="emit('update:author', $event.target.value)">
          <option value="">全部作者</option>
          <option v-for="option in authorOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>類型</span>
        <select :value="category" class="control" @change="emit('update:category', $event.target.value)">
          <option value="">全部類型</option>
          <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>起始日期</span>
        <input :value="startDate" class="control" type="date" @input="emit('update:startDate', $event.target.value)" />
      </label>

      <label class="field">
        <span>結束日期</span>
        <input :value="endDate" class="control" type="date" @input="emit('update:endDate', $event.target.value)" />
      </label>

      <label class="field">
        <span>排序方式</span>
        <select :value="sort" class="control" @change="emit('update:sort', $event.target.value)">
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <button class="reset-button" type="button" @click="emit('reset')">清除全部條件</button>
    </div>
  </section>
</template>
