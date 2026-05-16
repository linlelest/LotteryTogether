<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const code = ref('')
const loading = ref(false)
const error = ref('')

async function join() {
  if (!code.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/activities/by-code/${code.value.toUpperCase()}`)
    if (!data.isPublic && data.accessPassword) {
      router.push(`/activity/${data.id}`)
    } else {
      router.push(`/activity/${data.id}`)
    }
  } catch {
    error.value = '未找到该抽奖，请检查编号是否正确'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
    <div class="w-full max-w-sm text-center">
      <span class="text-2xl font-bold tracking-tight">
        <span class="text-[var(--text-primary)]">Lottery</span>
        <span class="text-[var(--accent)]">Together</span>
      </span>

      <div class="mt-6 bg-[var(--bg-card)] rounded-2xl border-1 border-solid border-[var(--border-color)] shadow-sm p-8">
        <h2 class="text-base font-semibold text-[var(--text-primary)] mb-2">加入抽奖</h2>
        <p class="text-xs text-[var(--text-muted)] mb-6">输入抽奖编号即可加入</p>

        <div class="space-y-4">
          <input
            v-model="code"
            type="text"
            placeholder="输入10位抽奖编号"
            maxlength="10"
            class="input text-center tracking-widest uppercase"
            @keyup.enter="join"
          />

          <div v-if="error" class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-full px-4 py-2 text-center">{{ error }}</div>

          <button class="btn-primary w-full py-3 text-base" :disabled="loading || !code.trim()" @click="join">
            {{ loading ? '查询中...' : '加入抽奖' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>