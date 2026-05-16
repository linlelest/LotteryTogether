<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import api from '@/api'
import { useSocket } from '@/composables/useSocket'

const stats = ref({ totalActivities: 0, totalParticipants: 0, winRate: 0 })
const recentActivities = ref<any[]>([])
const { connect, on, off } = useSocket()

onMounted(async () => {
  try {
    const { data: acts } = await api.get('/activities?pageSize=5')
    recentActivities.value = acts.items || []
    stats.value.totalActivities = acts.total || 0
  } catch { /* ignore */ }

  // WebSocket real-time updates
  connect(localStorage.getItem('accessToken') || undefined)
  on<any>('dashboard-update', (data) => {
    stats.value = data
  })
})

onUnmounted(() => {
  off('dashboard-update')
})

const winRateDisplay = computed(() => (stats.value.winRate * 100).toFixed(1) + '%')
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-[var(--text-primary)] mb-6">仪表盘</h1>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="card p-5 bg-[var(--bg-card)]">
        <p class="text-sm text-[var(--text-muted)]">总活动数</p>
        <p class="text-2xl font-bold text-[var(--text-primary)] mt-1">{{ stats.totalActivities }}</p>
      </div>
      <div class="card p-5 bg-[var(--bg-card)]">
        <p class="text-sm text-[var(--text-muted)]">参与人次</p>
        <p class="text-2xl font-bold text-[var(--text-primary)] mt-1">{{ stats.totalParticipants }}</p>
      </div>
      <div class="card p-5 bg-[var(--bg-card)]">
        <p class="text-sm text-[var(--text-muted)]">中奖率</p>
        <p class="text-2xl font-bold text-[var(--text-primary)] mt-1">{{ winRateDisplay }}</p>
      </div>
    </div>

    <!-- Chart placeholder -->
    <div class="card p-6 bg-[var(--bg-card)] mb-8">
      <h3 class="text-sm font-medium text-[var(--text-primary)] mb-4">参与趋势</h3>
      <div class="h-48 flex items-center justify-center bg-[var(--bg-secondary)] rounded-8px text-sm text-[var(--text-muted)]">
        图表区域（后续集成 Chart.js / ECharts）
      </div>
    </div>

    <!-- Recent activities -->
    <div class="card p-6 bg-[var(--bg-card)]">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-[var(--text-primary)]">最近活动</h3>
        <a href="/admin/activities" class="text-xs text-[var(--accent)] hover:underline">查看全部</a>
      </div>
      <div v-if="recentActivities.length === 0" class="text-sm text-[var(--text-muted)] py-8 text-center">暂无活动</div>
      <div v-else class="space-y-3">
        <div v-for="act in recentActivities" :key="act.id" class="flex items-center justify-between py-2 border-b-1 border-solid border-[var(--border-color)] last:border-0">
          <div>
            <p class="text-sm text-[var(--text-primary)]">{{ act.name }}</p>
            <p class="text-xs text-[var(--text-muted)]">{{ act.mode }} · {{ act.status }}</p>
          </div>
          <span class="text-xs px-2 py-1 rounded-4px" :class="act.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'">
            {{ act.status === 'active' ? '进行中' : act.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>