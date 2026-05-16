<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const route = useRoute()
const auth = useAuthStore()
const activity = ref<any>(null)
const toast = ref('')

const activityId = computed(() => Number(route.params.id))

const template = computed(() => {
  if (!activity.value) return ''
  const user = auth.user?.username || '某用户'
  const isEncrypted = !activity.value.isPublic && activity.value.accessPassword
  const encText = isEncrypted ? '加密抽奖' : '非加密抽奖'
  const pwdLine = isEncrypted ? `\n密码如下：${activity.value.accessPassword}` : ''
  const linkLine = `\n邀请链接为：${shortLink.value}`
  const url = window.location.origin
  const code = activity.value.lotteryCode || ''
  return (
    `${user} 邀您参加lotterytogether平台的抽奖\n` +
    `此抽奖为：${encText}${pwdLine}${linkLine}\n\n` +
    `您还可以手动访问：${url}\n` +
    `点击加入抽奖按钮，输入编号（10位数字的抽奖编号）：${code}\n` +
    `参与抽奖！`
  )
})

const shortLink = ref('')
const linkCopied = ref(false)
const pwdCopied = ref(false)
const codeCopied = ref(false)
const passwordVerified = ref(false)
const passwordInput = ref('')
const passwordError = ref('')
const checkingPwd = ref(false)

async function copyTemplate() {
  try {
    await navigator.clipboard.writeText(template.value)
    toast.value = '模板已复制'
    setTimeout(() => { toast.value = '' }, 2000)
  } catch { /* ignore */ }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shortLink.value)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  } catch { /* ignore */ }
}

async function copyPassword() {
  try {
    await navigator.clipboard.writeText(activity.value.accessPassword || '')
    pwdCopied.value = true
    setTimeout(() => { pwdCopied.value = false }, 2000)
  } catch { /* ignore */ }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(activity.value.lotteryCode || '')
    codeCopied.value = true
    setTimeout(() => { codeCopied.value = false }, 2000)
  } catch { /* ignore */ }
}

onMounted(async () => {
  try {
    const { data: act } = await api.get(`/activities/${activityId.value}`)
    activity.value = act

    // Password check for encrypted activities
    if (!act.isPublic && act.accessPassword) {
      const isCreator = auth.user?.id === act.createdById
      const sessionPwd = sessionStorage.getItem('pwd_' + activityId.value)
      if (isCreator || sessionPwd === act.accessPassword) {
        passwordVerified.value = true
      }
    } else {
      passwordVerified.value = true
    }

    const { data: link } = await api.post('/short-links', {
      targetUrl: window.location.origin + '/activity/' + activityId.value,
      activityId: activityId.value,
    }).catch(() => ({ data: {} }))
    shortLink.value = window.location.origin + '/s/' + (link.code || '')
  } catch { /* ignore */ }
})

async function checkSharePassword() {
  checkingPwd.value = true
  passwordError.value = ''
  try {
    const { data } = await api.post(`/activities/${activityId.value}/verify-password`, { password: passwordInput.value })
    if (data === true) {
      sessionStorage.setItem('pwd_' + activityId.value, passwordInput.value)
      passwordVerified.value = true
    } else {
      passwordError.value = '密码错误'
    }
  } catch {
    passwordError.value = '验证失败'
  } finally {
    checkingPwd.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-12">
    <div class="w-full max-w-lg">
      <div class="text-center mb-8">
        <span class="text-2xl font-bold tracking-tight">
          <span class="text-[var(--text-primary)]">Lottery</span>
          <span class="text-[var(--accent)]">Together</span>
        </span>
        <p class="text-sm text-[var(--text-muted)] mt-2">分享此抽奖给好友</p>
      </div>

      <div class="bg-[var(--bg-card)] rounded-2xl border border-solid border-[var(--border-color)] shadow-sm p-6 space-y-5">
        <!-- Password gate -->
        <div v-if="!passwordVerified" class="text-center py-4">
          <span class="text-3xl">🔒</span>
          <h2 class="text-base font-semibold text-[var(--text-primary)] mt-3">此抽奖需要访问密码</h2>
          <p class="text-sm text-[var(--text-muted)] mt-1">请输入密码以查看分享信息</p>
          <div class="mt-4">
            <input v-model="passwordInput" type="password" placeholder="输入访问密码" class="input" @keyup.enter="checkSharePassword" />
            <p v-if="passwordError" class="mt-2 text-xs text-red-500">{{ passwordError }}</p>
          </div>
          <button class="btn-primary w-full mt-4" :disabled="checkingPwd" @click="checkSharePassword">{{ checkingPwd ? '验证中...' : '验证密码' }}</button>
        </div>
        <template v-else>
        <!-- Activity name -->
        <div class="text-center">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ activity?.name || '加载中...' }}</h2>
        </div>

        <!-- Template preview -->
        <div class="bg-[var(--bg-secondary)] rounded-xl p-4 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-mono">
          {{ template || '正在生成...' }}
        </div>

        <!-- Copy template -->
        <button class="btn-primary w-full py-3 text-sm" @click="copyTemplate">复制分享模板</button>

        <!-- Individual copy items -->
        <div class="space-y-3 pt-2 border-t border-solid border-[var(--border-color)]">
          <div class="flex items-center justify-between">
            <span class="text-sm text-[var(--text-muted)]">邀请链接</span>
            <button class="text-xs px-3 py-1.5 rounded-full border border-solid border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all" :class="linkCopied ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : ''" @click="copyLink">{{ linkCopied ? '已复制' : '复制' }}</button>
          </div>

          <div v-if="!activity?.isPublic && activity?.accessPassword" class="flex items-center justify-between">
            <span class="text-sm text-[var(--text-muted)]">访问密码</span>
            <button class="text-xs px-3 py-1.5 rounded-full border border-solid border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all" :class="pwdCopied ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : ''" @click="copyPassword">{{ pwdCopied ? '已复制' : '复制' }}</button>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm text-[var(--text-muted)]">抽奖编号</span>
            <button class="text-xs px-3 py-1.5 rounded-full border border-solid border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all" :class="codeCopied ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : ''" @click="copyCode">{{ codeCopied ? '已复制' : '复制' }}</button>
          </div>
        </div>
        </template>
      </div>

      <!-- Toast -->
      <Teleport to="body">
        <div v-if="toast" class="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-full bg-[var(--bg-card)] border border-solid border-[var(--border-color)] shadow-md text-sm text-[var(--text-primary)] transition-all">
          {{ toast }}
        </div>
      </Teleport>
    </div>
  </div>
</template>