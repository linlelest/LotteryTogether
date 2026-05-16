<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked'
import api from '@/api'

const records = ref<any[]>([])
const prizes = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const pageSize = 15
const showModal = ref(false)
const currentActivityId = ref<number | null>(null)
const expandPrizeId = ref<number | null>(null)

async function openPrizes(record: any) {
  if (record.status === 'pending') {
    try {
      await api.patch(`/draws/${record.id}/status`, { status: 'claimed' })
      record.status = 'claimed'
    } catch { /* ignore */ }
  }
  const activityId = record.activityId || record.activity?.id
  if (!activityId) return
  currentActivityId.value = activityId
  try {
    const { data } = await api.get(`/prizes/activity/${activityId}`)
    prizes.value = data || []
  } catch { prizes.value = [] }
  showModal.value = true
}

async function claimPrize(record: any) {
  if (record.status === 'claimed') return
  try {
    await api.patch(`/draws/${record.id}/status`, { status: 'claimed' })
    record.status = 'claimed'
  } catch { /* ignore */ }
}

function toggleExpand(prizeId: number) {
  expandPrizeId.value = expandPrizeId.value === prizeId ? null : prizeId
}

function renderMarkdown(text: string) {
  if (!text) return ''
  try { return marked(text) } catch { return text }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/draws/me', { params: { page: page.value, pageSize } })
    records.value = data.items || []
    total.value = data.total || 0
  } catch { /* ignore */ }
  finally { loading.value = false }
}

function goPage(p: number) {
  page.value = p
  load()
}

onMounted(load)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-xl font-bold text-[var(--text-primary)] mb-6">我的抽奖历史</h1>

    <div class="card overflow-hidden bg-[var(--bg-card)]">
      <div v-if="loading" class="p-8 text-center text-sm text-[var(--text-muted)]">加载中...</div>
      <div v-else-if="records.length === 0" class="p-8 text-center text-sm text-[var(--text-muted)]">暂无参与记录</div>
      <div v-else class="divide-y divide-solid divide-[var(--border-color)]">
        <div v-for="r in records" :key="r.id" class="flex items-center gap-4 px-5 py-3 hover:bg-[var(--bg-secondary)]">
          <div class="flex-1 min-w-0">
            <p class="text-sm text-[var(--text-primary)] font-medium">{{ r.prizeName || '未中奖' }}</p>
            <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ r.activity?.name || '未知活动' }} · {{ new Date(r.drawnAt).toLocaleString('zh-CN') }}</p>
          </div>
          <button class="btn-primary text-xs px-3 py-1.5 shrink-0" @click="openPrizes(r)">查看奖品</button>
          <span class="text-xs px-3 py-1 rounded-full font-medium shrink-0" :class="r.status === 'claimed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'">{{ r.status === 'claimed' ? '已领取' : '待领奖' }}</span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex items-center justify-center gap-2 mt-4">
      <button class="btn-secondary text-xs px-3 py-1.5" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
      <span class="text-sm text-[var(--text-muted)]">第 {{ page }} / {{ Math.ceil(total / pageSize) }} 页</span>
      <button class="btn-secondary text-xs px-3 py-1.5" :disabled="page >= Math.ceil(total / pageSize)" @click="goPage(page + 1)">下一页</button>
    </div>

    <!-- Prize Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" @click.self="showModal = false">
        <div class="w-full max-w-lg mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-solid border-[var(--border-color)] shrink-0">
            <h3 class="text-base font-semibold text-[var(--text-primary)]">所有奖品</h3>
            <button class="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg" @click="showModal = false">✕</button>
          </div>
          <div class="px-6 py-4 overflow-y-auto space-y-3">
            <div v-if="prizes.length === 0" class="text-sm text-[var(--text-muted)] text-center py-4">暂无奖品</div>
            <div v-for="p in prizes" :key="p.id" class="p-4 rounded-xl bg-[var(--bg-secondary)]">
              <div class="flex items-center justify-between cursor-pointer" @click="toggleExpand(p.id)">
                <div>
                  <p class="text-sm font-medium text-[var(--text-primary)]">{{ p.name }}</p>
                  <p class="text-xs text-[var(--text-muted)] mt-0.5">库存 {{ p.stock }} · 权重 {{ p.weight }}</p>
                </div>
                <span class="text-[var(--text-muted)] text-sm transition-transform" :class="expandPrizeId === p.id ? 'rotate-180' : ''">▼</span>
              </div>
              <div v-if="expandPrizeId === p.id && p.description" class="mt-3 pt-3 border-t border-solid border-[var(--border-color)] text-sm text-[var(--text-secondary)] leading-relaxed prose prose-sm" v-html="renderMarkdown(p.description)"></div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.prose :deep(h2), .prose :deep(h3) { font-size: 1.05rem; font-weight: 600; margin: 0.5rem 0 0.25rem; color: var(--text-primary); }
.prose :deep(ul), .prose :deep(ol) { padding-left: 1.5rem; margin: 0.25rem 0; }
.prose :deep(code) { background: var(--bg-secondary); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875rem; }
.prose :deep(p) { margin: 0.25rem 0; }
</style>