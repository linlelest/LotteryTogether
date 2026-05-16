<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const props = defineProps<{
  activity: any
}>()

const auth = useAuthStore()
const emit = defineEmits<{ draw: [result: any] }>()

const content = ref('')
const submitting = ref(false)
const slips = ref<any[]>([])
const broadcast = ref({ total: 0, winner: '' })
const drawStatus = ref<any>(null)
const countdown = ref('')
let countdownTimer: any = null

const charCount = computed(() => content.value.length)
const isCreator = computed(() => auth.user?.id === props.activity.createdById)

const countdownText = computed(() => {
  if (!drawStatus.value) return ''
  if (drawStatus.value.triggerType === 'manual') return ''
  if (drawStatus.value.triggerType === 'time') {
    if (countdown.value) return `开奖倒计时：${countdown.value}`
    return '开奖时间已到'
  }
  if (drawStatus.value.triggerType === 'count') {
    return `参与人数：${drawStatus.value.totalSlips} / ${drawStatus.value.targetCount}`
  }
  return ''
})

async function submit() {
  if (!content.value.trim() || content.value.length > 200) return
  submitting.value = true
  try {
    await api.post('/paper-slips', { activityId: props.activity.id, content: content.value })
    broadcast.value.total++
    content.value = ''
    await loadSlips()
    await loadStatus()
  } catch { /* ignore */ }
  finally { submitting.value = false }
}

async function loadSlips() {
  try {
    const { data } = await api.get(`/paper-slips/${props.activity.id}`)
    slips.value = data || []
    broadcast.value.total = data?.length || 0
  } catch { /* ignore */ }
}

async function loadStatus() {
  try {
    const { data } = await api.get(`/paper-slips/${props.activity.id}/status`)
    drawStatus.value = data
  } catch { /* ignore */ }
}

async function manualDraw() {
  try {
    const { data } = await api.post(`/paper-slips/${props.activity.id}/draw`, { mode: 'random' })
    if (data) {
      alert(`开奖完成！中奖纸条：${data.slip.content.substring(0, 30)}...`)
      await loadSlips()
      await loadStatus()
    }
  } catch { /* ignore */ }
}

async function deleteSlip(id: number) {
  try {
    await api.delete(`/paper-slips/${id}`)
    slips.value = slips.value.filter((s: any) => s.id !== id)
    broadcast.value.total = slips.value.length
  } catch { /* ignore */ }
}

function updateCountdown() {
  if (!drawStatus.value?.drawTime) return
  const diff = new Date(drawStatus.value.drawTime).getTime() - Date.now()
  if (diff <= 0) { countdown.value = ''; return }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  countdown.value = `${h}h ${m}m ${s}s`
}

onMounted(() => {
  loadSlips()
  loadStatus()
  countdownTimer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-6">
    <div class="flex-1 flex flex-col items-center">
      <div class="w-64 h-72 md:w-80 md:h-80 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-transparent border-2 border-dashed border-[var(--accent)]/40 flex items-center justify-center" style="transform: rotateX(5deg) rotateY(-10deg); transform-style: preserve-3d;">
        <div class="text-center">
          <span class="text-5xl block mb-2">📥</span>
          <p class="text-sm text-[var(--text-muted)]">已入箱 {{ broadcast.total }} 条纸条</p>
        </div>
      </div>

      <div class="w-full max-w-md mt-6 space-y-3">
        <textarea v-model="content" maxlength="200" rows="3" placeholder="写下你想说的内容（限200字）..." class="w-full px-4 py-3 rounded-2xl border border-solid border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-y"></textarea>
        <div class="flex items-center justify-between">
          <span class="text-xs text-[var(--text-muted)]">{{ charCount }}/200</span>
          <button class="btn-primary text-sm" :disabled="submitting || !content.trim() || charCount > 200" @click="submit">{{ submitting ? '提交中...' : '📤 投递纸条' }}</button>
        </div>
      </div>

      <div class="w-full max-w-md mt-6">
        <h3 class="text-sm font-medium text-[var(--text-primary)] mb-3">📋 纸条墙</h3>
        <div v-if="slips.length === 0" class="text-xs text-[var(--text-muted)] text-center py-4">暂无纸条</div>
        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <div v-for="s in slips.slice().reverse()" :key="s.id" class="flex items-start gap-2 p-3 rounded-2xl bg-[var(--bg-secondary)] text-sm">
            <p class="flex-1 text-[var(--text-primary)]">{{ s.content }}</p>
            <button v-if="isCreator" class="text-xs px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0" @click="deleteSlip(s.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-64">
      <div class="card p-4 bg-[var(--bg-card)] sticky top-20 space-y-4">
        <div>
          <h3 class="text-sm font-medium text-[var(--text-primary)] mb-3">📡 实时广播</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-[var(--text-muted)]">已入箱数量</span>
              <span class="text-[var(--text-primary)] font-medium">{{ broadcast.total }}</span>
            </div>
          </div>
        </div>

        <div v-if="countdownText" class="pt-3 border-t border-solid border-[var(--border-color)]">
          <p class="text-xs text-[var(--accent)] font-medium">{{ countdownText }}</p>
        </div>

        <div v-if="isCreator && drawStatus?.canDraw" class="pt-3 border-t border-solid border-[var(--border-color)]">
          <button class="btn-primary w-full text-sm py-2.5" @click="manualDraw">🎰 手动开奖</button>
        </div>
      </div>
    </div>
  </div>
</template>