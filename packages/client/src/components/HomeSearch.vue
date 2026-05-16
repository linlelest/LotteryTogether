<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ search: [keyword: string] }>()

const keyword = ref('')
const showHistory = ref(false)
const searchHistory = ref<string[]>([])

function onSearch() {
  if (keyword.value.trim()) {
    searchHistory.value.unshift(keyword.value.trim())
    if (searchHistory.value.length > 10) searchHistory.value.pop()
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  }
  emit('search', keyword.value.trim())
}

function clearHistory() {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

function selectHistory(h: string) {
  keyword.value = h
  onSearch()
}

const saved = localStorage.getItem('searchHistory')
if (saved) {
  try { searchHistory.value = JSON.parse(saved) } catch { /* ignore */ }
}

const blurHistory = () => { setTimeout(() => { showHistory.value = false }, 200) }
</script>

<template>
  <div class="relative">
    <input
      v-model="keyword"
      type="text"
      placeholder="搜索活动名称..."
      class="input pr-12"
      @keyup.enter="onSearch"
      @focus="showHistory = searchHistory.length > 0"
      @blur="blurHistory"
    />
    <button class="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-all" @click="onSearch">🔍</button>

    <div v-if="showHistory && searchHistory.length" class="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-solid border-[var(--border-color)] rounded-2xl shadow-md z-10 p-2">
      <div class="flex items-center justify-between px-3 py-1.5">
        <span class="text-xs text-[var(--text-muted)]">搜索历史</span>
        <button class="text-xs text-[var(--accent)] hover:underline" @click="clearHistory">清除</button>
      </div>
      <button v-for="h in searchHistory" :key="h" class="block w-full text-left px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-full" @click="selectHistory(h)">{{ h }}</button>
    </div>
  </div>
</template>