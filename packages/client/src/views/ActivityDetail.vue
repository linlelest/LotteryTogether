<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activity = ref<any>(null)
const prizes = ref<any[]>([])
const loading = ref(true)
const accessGranted = ref(false)
const passwordInput = ref('')
const passwordError = ref('')
const checkingPassword = ref(false)
const showResultModal = ref(false)
const resultData = ref<any>(null)

const activityId = computed(() => Number(route.params.id))

onMounted(async () => {
  try {
    const { data: act } = await api.get(`/activities/${activityId.value}`)
    if (act.status === 'draft') { router.replace('/not-found'); return }

    // Guest + not ended → skip to lottery page
    if (!auth.isLoggedIn && act.status !== 'ended') {
      router.replace('/lottery/' + activityId.value)
      return
    }

    activity.value = act
    // Skip password check for the creator
    const isCreator = auth.user?.id === act.createdById
    if (!isCreator && act.isPublic === false && act.accessPassword) {
      accessGranted.value = false
    } else {
      accessGranted.value = true
    }
    const { data: p } = await api.get(`/prizes/activity/${activityId.value}`)
    prizes.value = p || []

    // Check for draw result in query params
    if (route.query.result) {
      try {
        resultData.value = JSON.parse(decodeURIComponent(route.query.result as string))
        showResultModal.value = true
      } catch { /* ignore */ }
    }
  } catch { router.replace('/not-found') }
  finally { loading.value = false }
})

async function checkPassword() {
  checkingPassword.value = true
  passwordError.value = ''
  try {
    const { data } = await api.post(`/activities/${activityId.value}/verify-password`, { password: passwordInput.value })
    if (data === true) {
      accessGranted.value = true
    } else {
      passwordError.value = '密码错误'
    }
  } catch {
    passwordError.value = '验证失败'
  } finally {
    checkingPassword.value = false
  }
}

function participate() {
  if (auth.isLoggedIn || activity.value?.requireLogin !== true) {
    router.push(`/lottery/${activityId.value}`)
  } else {
    router.push('/auth')
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="max-w-3xl mx-auto px-4 py-12">
      <div class="animate-pulse space-y-4">
        <div class="h-8 bg-[var(--bg-secondary)] rounded-8px w-1/2"></div>
        <div class="h-48 bg-[var(--bg-secondary)] rounded-12px"></div>
      </div>
    </div>

    <div v-else-if="!activity" class="max-w-3xl mx-auto px-4 py-12 text-center text-sm text-[var(--text-muted)]">
      活动不存在
    </div>

    <!-- Password gate -->
    <div v-else-if="!accessGranted" class="max-w-md mx-auto px-4 py-16">
      <div class="card p-8 bg-[var(--bg-card)] text-center">
        <span class="text-3xl">🔒</span>
        <h2 class="text-base font-semibold text-[var(--text-primary)] mt-3">此活动需要访问密码</h2>
        <p class="text-sm text-[var(--text-muted)] mt-1">请输入密码以查看活动详情</p>
        <div class="mt-4">
          <input
            v-model="passwordInput"
            type="password"
            placeholder="输入访问密码"
            class="w-full px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            @keyup.enter="checkPassword"
          />
          <p v-if="passwordError" class="mt-2 text-xs text-red-500">{{ passwordError }}</p>
        </div>
        <button class="btn-primary w-full mt-4" :disabled="checkingPassword" @click="checkPassword">
          {{ checkingPassword ? '验证中...' : '验证密码' }}
        </button>
      </div>
    </div>

    <div v-else class="max-w-3xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row gap-6 mb-8">
        <div class="w-full md:w-80 shrink-0 aspect-[16/9] md:aspect-auto md:h-48 rounded-12px bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
          <img v-if="activity.cover" :src="activity.cover" class="w-full h-full object-cover" />
          <span v-else class="text-4xl opacity-30">🎯</span>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2 py-0.5 rounded-4px bg-[var(--accent)]/10 text-[var(--accent)]">
              {{ ({ wheel: '转盘', blindbox: '盲盒', paper: '纸条' } as Record<string, string>)[activity.mode] || activity.mode }}
            </span>
            <span v-if="activity.status === 'active'" class="text-xs px-2 py-0.5 rounded-4px bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">进行中</span>
            <span v-else class="text-xs px-2 py-0.5 rounded-4px bg-gray-100 text-gray-500 dark:bg-gray-800">{{ activity.status }}</span>
            <span v-if="!activity.isPublic" class="text-xs px-2 py-0.5 rounded-4px bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">🔒 私密</span>
          </div>
          <h1 class="text-xl md:text-2xl font-bold text-[var(--text-primary)]">{{ activity.name }}</h1>
          <p class="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{{ activity.description || '暂无描述' }}</p>
          <div class="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
            <span>📅 {{ activity.startTime ? new Date(activity.startTime).toLocaleDateString('zh-CN') : '立即' }} ~ {{ activity.endTime ? new Date(activity.endTime).toLocaleDateString('zh-CN') : '长期' }}</span>
            <span>👥 参与人数 {{ activity.participantCount || 0 }}</span>
          </div>
          <button class="btn-primary mt-4 px-8 py-2.5" :disabled="activity.status !== 'active'" @click="participate">
            {{ activity.status === 'active' ? '立即参与' : '活动已结束' }}
          </button>
          <div v-if="activity.status === 'ended' && activity.forceEndReason" class="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-solid border-red-200 dark:border-red-800">
            <p class="text-xs font-medium text-red-600 dark:text-red-400">活动已强制结束</p>
            <p class="text-xs text-red-500 dark:text-red-300 mt-1">理由：{{ activity.forceEndReason }}</p>
          </div>
        </div>
      </div>

      <!-- Prizes -->
      <div class="card p-6 bg-[var(--bg-card)] mb-6">
        <h2 class="text-base font-semibold text-[var(--text-primary)] mb-4">🎁 奖品列表</h2>
        <div v-if="prizes.length === 0" class="text-sm text-[var(--text-muted)]">暂无奖品</div>
        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="p in prizes" :key="p.id" class="p-3 rounded-8px bg-[var(--bg-secondary)] text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-8px bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden">
              <img v-if="p.image" :src="p.image" class="w-full h-full object-cover" />
              <span v-else class="text-lg">🎫</span>
            </div>
            <p class="text-sm text-[var(--text-primary)] font-medium">{{ p.name }}</p>
            <p class="text-xs text-[var(--text-muted)] mt-1">虚拟 · 库存 {{ p.stock }}</p>
          </div>
        </div>
      </div>

      <!-- Rules -->
      <div class="card p-6 bg-[var(--bg-card)]">
        <h2 class="text-base font-semibold text-[var(--text-primary)] mb-4">📋 参与条件</h2>
        <ul class="text-sm text-[var(--text-secondary)] space-y-2">
          <li>• 活动状态为「进行中」时方可参与</li>
          <li>• 每个账号的参与次数请参考活动规则</li>
          <li>• 中奖后请在个人中心查看并领取奖品</li>
          <li>• 实物奖品需填写收货地址后方可发货</li>
        </ul>
      </div>
    </div>
    <!-- Result modal -->
    <Teleport to="body">
      <div v-if="showResultModal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" @click.self="showResultModal = false">
        <div class="w-full max-w-sm mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md p-6 text-center">
          <span class="text-4xl">🎉</span>
          <h2 class="text-lg font-semibold text-[var(--text-primary)] mt-3">恭喜以下用户！</h2>
          <div class="mt-4 p-4 rounded-xl bg-[var(--bg-secondary)]">
            <p class="text-sm font-medium text-[var(--text-primary)]">用户 #{{ resultData?.userId }}</p>
            <p class="text-sm text-[var(--accent)] mt-1">获得奖品：{{ resultData?.prizeName || '未知' }}</p>
          </div>
          <button class="btn-primary mt-5 px-8 py-2.5 text-sm" @click="showResultModal = false">知道了</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>