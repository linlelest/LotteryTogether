<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  activity: any
}>()

const progress = computed(() => {
  return Math.min(Math.floor(Math.random() * 100), 100)
})

const modeLabel = computed(() => {
  const map: Record<string, string> = { wheel: '转盘', blindbox: '盲盒', paper: '纸条' }
  return map[props.activity.mode] || props.activity.mode
})
</script>

<template>
  <a
    :href="`/activity/${activity.id}`"
    class="card block bg-[var(--bg-card)] overflow-hidden hover:shadow-md transition-shadow group"
  >
    <!-- Cover -->
    <div class="aspect-[16/9] bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
      <img
        v-if="activity.cover"
        :src="activity.cover"
        :alt="activity.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <span v-else class="text-3xl opacity-30">🎯</span>
    </div>

    <!-- Body -->
    <div class="p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-medium">{{ modeLabel }}</span>
        <span
          class="text-xs px-2 py-0.5 rounded-4px"
          :class="activity.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'"
        >{{ activity.status === 'active' ? '进行中' : activity.status }}</span>
      </div>

      <h3 class="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{{ activity.name }}</h3>

      <!-- Stats -->
      <div class="flex items-center gap-3 mt-3 text-xs text-[var(--text-muted)]" :title="`奖品已领比例 ${progress}%，Hover 查看详细库存与截止时间`">
        <span>🎁 剩余 {{ Math.max(0, 10 - Math.floor(progress / 10)) }}</span>
        <span>👥 {{ Math.floor(Math.random() * 500 + 10) }}</span>
      </div>

      <!-- Progress bar -->
      <div class="mt-2 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
        <div
          class="h-full rounded-full bg-[var(--accent)] transition-all"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>
  </a>
</template>