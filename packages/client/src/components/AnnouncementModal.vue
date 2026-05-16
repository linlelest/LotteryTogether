<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { marked } from 'marked'
import api from '@/api'

const announcements = ref<any[]>([])
const currentIndex = ref(0)
const countdown = ref(0)
const dismissDisabled = ref(false)
let timer: any = null

const current = computed(() => announcements.value[currentIndex.value] || null)

const html = computed(() => {
  if (!current.value?.content) return ''
  try { return marked(current.value.content) } catch { return current.value.content }
})

function setupCountdown() {
  if (timer) clearInterval(timer)
  if (current.value?.forceRead && current.value?.forceReadSeconds > 0) {
    dismissDisabled.value = true
    countdown.value = current.value.forceReadSeconds
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) { clearInterval(timer); dismissDisabled.value = false }
    }, 1000)
  } else {
    dismissDisabled.value = false
  }
}

function dismissAndNext() {
  if (dismissDisabled.value) return
  if (current.value) {
    const ids = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
    ids.push(current.value.id)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(ids))
  }
  showNext()
}

function handleMainAction() {
  if (dismissDisabled.value) return
  if (currentIndex.value < announcements.value.length - 1) {
    showNext()
  } else if (current.value?.showDismiss !== false) {
    dismissAndNext()
  } else {
    closeAll()
  }
}

function showNext() {
  if (currentIndex.value < announcements.value.length - 1) {
    currentIndex.value++
    setupCountdown()
  } else {
    closeAll()
  }
}

function closeAll() {
  if (timer) clearInterval(timer)
  announcements.value = []
}

onMounted(async () => {
  try {
    const { data } = await api.get('/announcements')
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
    const active = (data || []).filter((a: any) => !dismissed.includes(a.id))
    if (active.length > 0) { announcements.value = active; currentIndex.value = 0; setupCountdown() }
  } catch { /* ignore */ }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="current" class="fixed inset-0 z-[300] flex items-center justify-center bg-black/60">
      <div class="w-full max-w-md mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-solid border-[var(--border-color)]">
          <h3 class="text-base font-semibold text-[var(--text-primary)]">{{ current.title }}</h3>
          <div class="flex items-center gap-2">
            <!-- Countdown badge -->
            <span v-if="dismissDisabled" class="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">{{ countdown }}s</span>
            <button class="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-all" :class="dismissDisabled ? 'opacity-30 cursor-not-allowed' : ''" :disabled="dismissDisabled" @click="dismissDisabled ? null : closeAll">✕</button>
          </div>
        </div>
        <div class="px-6 py-4 max-h-72 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed prose prose-sm" v-html="html"></div>
        <div class="px-6 py-4 border-t border-solid border-[var(--border-color)] flex items-center justify-end">
          <div class="flex items-center gap-2">
            <button class="btn-primary text-sm px-5 py-2" :disabled="dismissDisabled" @click="handleMainAction">{{ currentIndex < announcements.length - 1 ? '下一条' : (current?.showDismiss !== false ? '不再提示' : '关闭') }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.prose :deep(h2), .prose :deep(h3) { font-size: 1.05rem; font-weight: 600; margin: 0.5rem 0 0.25rem; color: var(--text-primary); }
.prose :deep(ul), .prose :deep(ol) { padding-left: 1.5rem; margin: 0.25rem 0; }
.prose :deep(code) { background: var(--bg-secondary); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875rem; }
.prose :deep(p) { margin: 0.25rem 0; }
</style>