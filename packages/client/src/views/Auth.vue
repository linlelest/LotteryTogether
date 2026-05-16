<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { marked } from 'marked'
import api from '@/api'

const router = useRouter()
const auth = useAuthStore()

const isLogin = ref(true)
const username = ref('')
const password = ref('')
const inviteCode = ref('')
const loading = ref(false)
const error = ref('')

const showInviteModal = ref(false)
const inviteHint = ref('')
const inviteEnabled = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/auth/invite-info')
    inviteEnabled.value = data.enabled
    inviteHint.value = data.hint
  } catch { /* ignore */ }
})

const hintHtml = computed(() => {
  try { return marked(inviteHint.value) }
  catch { return inviteHint.value }
})

async function submit() {
  error.value = ''
  if (!isLogin.value && inviteEnabled.value && !inviteCode.value.trim()) {
    showInviteModal.value = true
    return
  }
  loading.value = true
  try {
    if (isLogin.value) {
      await auth.login(username.value, password.value)
    } else {
      await auth.register(username.value, password.value, inviteCode.value || undefined)
    }
    router.push('/activities')
  } catch (e: any) {
    const msg = e.response?.data?.message || '操作失败'
    if (!isLogin.value && (msg.includes('Invitation') || msg.includes('邀请码'))) {
      showInviteModal.value = true
    } else {
      error.value = msg
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-6">
        <span class="text-2xl font-bold tracking-tight">
          <span class="text-[var(--text-primary)]">Lottery</span>
          <span class="text-[var(--accent)]">Together</span>
        </span>
      </div>

      <div class="bg-[var(--bg-card)] rounded-2xl border-1 border-solid border-[var(--border-color)] shadow-sm p-8">
        <!-- Tabs -->
        <div class="flex mb-6 bg-[var(--bg-secondary)] rounded-full p-1">
          <button
            class="flex-1 py-2 text-sm font-medium rounded-full transition-all"
            :class="isLogin ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
            @click="isLogin = true"
          >登录</button>
          <button
            class="flex-1 py-2 text-sm font-medium rounded-full transition-all"
            :class="!isLogin ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
            @click="isLogin = false"
          >注册</button>
        </div>

        <div v-if="error" class="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-full px-4 py-2 text-center">{{ error }}</div>

      <form @submit.prevent="submit" class="space-y-4">
          <input v-model="username" type="text" placeholder="用户名" required minlength="2" maxlength="32" class="input" />
          <input v-model="password" type="password" placeholder="密码" required minlength="6" class="input" />
          <input v-if="!isLogin && inviteEnabled" v-model="inviteCode" type="text" placeholder="邀请码" class="input" />

          <button type="submit" class="btn-primary w-full py-3 text-base" :disabled="loading">
            {{ loading ? '处理中...' : isLogin ? '登录' : '注册' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Invite modal -->
    <Teleport to="body">
      <div v-if="showInviteModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" @click.self="showInviteModal = false">
        <div class="w-full max-w-md mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b-1 border-solid border-[var(--border-color)]">
            <h3 class="text-base font-semibold text-[var(--text-primary)]">获取邀请码</h3>
            <button class="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg" @click="showInviteModal = false">✕</button>
          </div>
          <div class="px-6 py-4 max-h-72 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed prose prose-sm" v-html="hintHtml"></div>
          <div class="px-6 py-4 border-t-1 border-solid border-[var(--border-color)] flex justify-end">
            <button class="btn-primary text-sm" @click="showInviteModal = false">知道了</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>