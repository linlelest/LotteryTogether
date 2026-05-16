<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const needsSetup = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/auth/needs-setup')
    needsSetup.value = data.needsSetup
    if (!data.needsSetup) router.push('/auth')
  } catch { /* ignore */ }
})

async function submit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = '两次密码不一致'
    return
  }
  loading.value = true
  try {
    const { data } = await api.post('/auth/register', { username: username.value, password: password.value })
    localStorage.setItem('accessToken', data.accessToken)
    router.push('/activities')
  } catch (e: any) {
    error.value = e.response?.data?.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-6">
        <span class="text-2xl font-bold tracking-tight">
          <span class="text-[var(--text-primary)]">Lottery</span>
          <span class="text-[var(--accent)]">Together</span>
        </span>
        <p class="text-sm text-[var(--text-muted)] mt-2">首次使用，请创建管理员账号</p>
      </div>

      <div class="bg-[var(--bg-card)] rounded-2xl border-1 border-solid border-[var(--border-color)] shadow-sm p-8">
        <div v-if="!needsSetup" class="text-sm text-[var(--text-muted)] text-center py-4">
          系统已初始化，正在跳转...
        </div>

        <form v-else @submit.prevent="submit" class="space-y-4">
          <div v-if="error" class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-full px-4 py-2 text-center">{{ error }}</div>
          <input v-model="username" type="text" placeholder="管理员用户名" required minlength="2" class="input" />
          <input v-model="password" type="password" placeholder="密码 (至少6位)" required minlength="6" class="input" />
          <input v-model="confirmPassword" type="password" placeholder="确认密码" required minlength="6" class="input" />
          <button type="submit" class="btn-primary w-full py-3 text-base" :disabled="loading">
            {{ loading ? '创建中...' : '创建管理员账号' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>