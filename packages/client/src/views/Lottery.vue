<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'
import { marked } from 'marked'
import { useSocket } from '@/composables/useSocket'
import WheelOfFortune from '@/components/WheelOfFortune.vue'
import BlindBox from '@/components/BlindBox.vue'
import PaperSlip from '@/components/PaperSlip.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activity = ref<any>(null)
const prizes = ref<any[]>([])
const loading = ref(true)
const { connect, joinActivity, leaveActivity } = useSocket()

const showResult = ref(false)
const lastResult = ref<any>(null)
const results = ref<any[]>([])

// Guest info modal
const showInfo = ref(false)
const pwdInput = ref('')
const pwdError = ref('')
const checkingPwd = ref(false)
const pwdPassed = ref(false)
const guestReady = ref(false) // guest has dismissed info modal

const activityId = computed(() => Number(route.params.id))

function renderMarkdown(text: string) {
  if (!text) return ''
  try { return marked(text) } catch { return text }
}

onMounted(async () => {
  try {
    const { data: act } = await api.get(`/activities/${activityId.value}`)
    activity.value = act
    const { data: p } = await api.get(`/prizes/activity/${activityId.value}`)
    prizes.value = p || []

    if (!auth.isLoggedIn) {
      // Guest: check session results, show info modal
      const stored = sessionStorage.getItem('results_' + activityId.value)
      if (stored) { try { results.value = JSON.parse(stored) } catch {} }
      // Check password from session
      const sessionPwd = sessionStorage.getItem('pwd_' + activityId.value)
      const isCreator = auth.user?.id === act.createdById
      if (isCreator || !act.accessPassword || act.isPublic === false && sessionPwd === act.accessPassword) {
        pwdPassed.value = true
      }
      // If activity has password and not passed, show info modal with password gate
      showInfo.value = true
    } else {
      // Logged-in: check login requirement
      if (act.requireLogin === true && !auth.isLoggedIn) { router.push('/auth'); return }
      if (act.mode === 'paper' && !auth.isLoggedIn) { router.push('/auth'); return }
      guestReady.value = true
    }
  } catch { router.push('/') }
  finally { loading.value = false }

  connect(localStorage.getItem('accessToken') || undefined)
  joinActivity(activityId.value)
})

onUnmounted(() => { leaveActivity(activityId.value) })

async function checkPwd() {
  checkingPwd.value = true
  pwdError.value = ''
  try {
    const { data } = await api.post(`/activities/${activityId.value}/verify-password`, { password: pwdInput.value })
    if (data === true) {
      sessionStorage.setItem('pwd_' + activityId.value, pwdInput.value)
      pwdPassed.value = true
    } else {
      pwdError.value = '密码错误'
    }
  } catch {
    pwdError.value = '验证失败'
  } finally {
    checkingPwd.value = false
  }
}

function dismissInfo() {
  showInfo.value = false
  guestReady.value = true
}

function onDraw(result: any) {
  lastResult.value = result
  results.value.push(result)
  if (!auth.isLoggedIn) {
    sessionStorage.setItem('results_' + activityId.value, JSON.stringify(results.value))
  }
  showResult.value = true
}

function continueDraw() { showResult.value = false }

function viewHistory() {
  showResult.value = false
  router.push('/history')
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <div v-if="loading" class="text-center py-16 text-sm text-[var(--text-muted)]">加载中...</div>
    <template v-else-if="activity && guestReady">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-bold text-[var(--text-primary)]">{{ activity.name }}</h1>
          <p class="text-sm text-[var(--text-muted)] mt-1">{{ activity.description }}</p>
        </div>
        <button class="btn-primary text-sm shrink-0" @click="router.push('/share/' + activity.id)">分享该抽奖</button>
      </div>
      <WheelOfFortune v-if="activity.mode === 'wheel'" :activity="activity" :prizes="prizes" @draw="onDraw" />
      <BlindBox v-else-if="activity.mode === 'blindbox'" :activity="activity" :prizes="prizes" @draw="onDraw" />
      <PaperSlip v-else-if="activity.mode === 'paper'" :activity="activity" @draw="onDraw" />
    </template>

    <!-- Guest Info Modal -->
    <Teleport to="body">
      <div v-if="showInfo && activity" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
        <div class="w-full max-w-md mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md max-h-[80vh] flex flex-col">
          <div class="px-6 py-4 border-b border-solid border-[var(--border-color)] shrink-0">
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ activity.name }}</h2>
            <p class="text-sm text-[var(--text-muted)] mt-1">{{ activity.description }}</p>
          </div>
          <div class="px-6 py-4 overflow-y-auto space-y-4 flex-1">
            <!-- Password gate -->
            <div v-if="!activity.isPublic && activity.accessPassword && !pwdPassed" class="text-center py-2">
              <span class="text-2xl">🔒</span>
              <p class="text-sm text-[var(--text-secondary)] mt-2">此抽奖需要访问密码</p>
              <input v-model="pwdInput" type="password" placeholder="输入密码" class="input mt-3" @keyup.enter="checkPwd" />
              <p v-if="pwdError" class="text-xs text-red-500 mt-1">{{ pwdError }}</p>
              <button class="btn-primary w-full mt-3 py-2 text-sm" :disabled="checkingPwd" @click="checkPwd">{{ checkingPwd ? '验证中...' : '验证密码' }}</button>
            </div>
            <!-- Prize list -->
            <div v-if="pwdPassed || activity.isPublic || !activity.accessPassword">
              <h3 class="text-sm font-semibold text-[var(--text-primary)] mb-2">🎁 奖品列表</h3>
              <div v-if="prizes.length === 0" class="text-sm text-[var(--text-muted)]">暂无奖品</div>
              <div v-else class="space-y-2">
                <div v-for="p in prizes" :key="p.id" class="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <p class="text-sm font-medium text-[var(--text-primary)]">{{ p.name }}</p>
                  <p class="text-xs text-[var(--text-muted)]">库存 {{ p.stock }} · 权重 {{ p.weight }}</p>
                  <div v-if="p.description" class="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed prose prose-sm" v-html="renderMarkdown(p.description)"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-solid border-[var(--border-color)] shrink-0 flex justify-end">
            <button class="btn-primary text-sm px-6 py-2" :disabled="!pwdPassed && !activity.isPublic && !!activity.accessPassword" @click="dismissInfo">知道了，开始抽奖</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Result Modal -->
    <Teleport to="body">
      <div v-if="showResult" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" @click.self="continueDraw">
        <div class="w-full max-w-sm mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md p-6 text-center">
          <span class="text-4xl">🎉</span>
          <h2 class="text-lg font-semibold text-[var(--text-primary)] mt-3">恭喜获得</h2>
          <p class="text-xl font-bold text-[var(--accent)] mt-2">{{ lastResult?.prize?.name || '未中奖' }}</p>
          <p class="text-xs text-[var(--text-muted)] mt-3">已抽 {{ results.length }} 次</p>
          <div class="flex items-center gap-3 mt-5">
            <button class="btn-primary flex-1 py-2.5 text-sm" @click="continueDraw">继续抽奖</button>
            <button v-if="auth.isLoggedIn" class="btn-secondary flex-1 py-2.5 text-sm" @click="viewHistory">查看历史</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>