<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const router = useRouter()
const route = useRoute()
const editId = computed(() => route.params.id ? Number(route.params.id) : null)
const addonly = computed(() => route.query.mode === 'addonly')

const currentStep = ref(1)
const loading = ref(false)

// Step 1
const name = ref('')
const description = ref('')
const cover = ref('')
const startTime = ref('')
const endTime = ref('')
const permanent = ref(false)
const isPublic = ref(true)
const accessPassword = ref('')
const requireLogin = ref(true)
const createdLotteryCode = ref('')
const showLotteryCode = ref(false)
const showStep2Confirm = ref(false)

async function uploadCover(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  const fd = new FormData()
  fd.append('file', f)
  const { data } = await api.post('/upload', fd)
  cover.value = data.url
}

async function uploadPrizeImage(p: any, e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  const fd = new FormData()
  fd.append('file', f)
  const { data } = await api.post('/upload', fd)
  p.image = data.url
}

// Step 2
const mode = ref<'wheel' | 'blindbox' | 'paper'>('wheel')
const drawLimit = ref(0)
const dailyLimit = ref(0)
const blindBoxGridSize = ref(9)
const blindBoxOpenable = ref(3)
const paperQuestion = ref('')
const paperPrizeCount = ref(1)
const paperDrawTrigger = ref<'time' | 'count' | 'manual'>('time')
const paperDrawTime = ref('')
const paperDrawCount = ref(10)

// Step 3 - IP & rate limit
const ipDailyLimit = ref(0)
const ipRateValue = ref(10)
const ipRateUnit = ref<'second' | 'minute' | 'hour' | 'day'>('minute')
const userRateValue = ref(10)
const userRateUnit = ref<'second' | 'minute' | 'hour' | 'day'>('second')

// Step 4 - prizes
const prizes = ref<any[]>([{ name: '', type: 'virtual', stock: 1, weight: 1, image: '', description: '' }])

function copyLotteryCode() {
  navigator.clipboard.writeText(createdLotteryCode.value)
}

onMounted(async () => {
  if (!editId.value) return
  try {
    const { data: act } = await api.get('/activities/' + editId.value)
    name.value = act.name
    description.value = act.description || ''
    mode.value = act.mode
    isPublic.value = act.isPublic
    requireLogin.value = act.requireLogin
    accessPassword.value = act.accessPassword || ''
    startTime.value = act.startTime ? act.startTime.substring(0, 16) : ''
    endTime.value = act.endTime ? act.endTime.substring(0, 16) : ''
    permanent.value = !act.startTime && !act.endTime
    blindBoxGridSize.value = act.blindBoxGridSize || 9
    blindBoxOpenable.value = act.blindBoxOpenable || 3
    paperQuestion.value = act.paperQuestion || ''
    paperPrizeCount.value = act.paperPrizeCount || 1
    paperDrawTrigger.value = act.paperDrawTrigger || 'time'
    paperDrawTime.value = act.paperDrawTime ? act.paperDrawTime.substring(0, 16) : ''
    paperDrawCount.value = act.paperDrawCount || 10
    createdLotteryCode.value = act.lotteryCode || ''
    const { data: p } = await api.get('/prizes/activity/' + editId.value)
    if (p && p.length) prizes.value = p
  } catch { /* ignore */ }
})

function addPrize() {
  prizes.value.push({ name: '', type: 'virtual', stock: 1, weight: 1, image: '', description: '' })
}

function removePrize(idx: number) {
  prizes.value.splice(idx, 1)
}

async function submit() {
  loading.value = true
  try {
    const body: any = {
      name: name.value,
      description: description.value,
      cover: cover.value || undefined,
      mode: mode.value,
      isPublic: isPublic.value,
      requireLogin: requireLogin.value,
      blindBoxGridSize: mode.value === 'blindbox' ? blindBoxGridSize.value : undefined,
      blindBoxOpenable: mode.value === 'blindbox' ? blindBoxOpenable.value : undefined,
      paperQuestion: mode.value === 'paper' ? paperQuestion.value : undefined,
      paperPrizeCount: mode.value === 'paper' ? paperPrizeCount.value : undefined,
      paperDrawTrigger: mode.value === 'paper' ? paperDrawTrigger.value : undefined,
      paperDrawTime: mode.value === 'paper' && paperDrawTrigger.value === 'time' ? paperDrawTime.value : undefined,
      paperDrawCount: mode.value === 'paper' && paperDrawTrigger.value === 'count' ? paperDrawCount.value : undefined,
      accessPassword: isPublic.value ? undefined : accessPassword.value || undefined,
      startTime: (mode.value === 'paper' || permanent.value) ? undefined : startTime.value || undefined,
      endTime: (mode.value === 'paper' || permanent.value) ? undefined : endTime.value || undefined,
    }

    let activity: any
    if (editId.value) {
      const { data } = await api.patch(`/activities/${editId.value}`, body)
      activity = data
      // Restore to active if this was an addonly edit
      if (addonly) {
        await api.patch(`/activities/${editId.value}/status`, { status: 'active' })
      }
    } else {
      const { data } = await api.post('/activities', body)
      activity = data
    }

    createdLotteryCode.value = activity.lotteryCode || ''
    showLotteryCode.value = true

    // Set prizes
    if (prizes.value.length) {
      await api.post(`/prizes/bulk/${activity.id}`, { prizes: prizes.value })
    }

    if (!editId.value) {
      // New activity: show publish prompt
      router.push('/activities/manageact?created=' + activity.id)
    } else {
      router.push('/activities/manageact')
    }
  } catch (e: any) {
    alert(e.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-xl font-bold text-[var(--text-primary)] mb-6">{{ editId ? '编辑活动' : '创建活动' }}</h1>

    <!-- Step indicators -->
    <div class="flex mb-8 bg-[var(--bg-secondary)] rounded-full p-1">
      <button v-for="s in (mode === 'paper' ? 3 : 4)" :key="s" class="flex-1 py-2 text-sm text-center rounded-full transition-all" :class="currentStep === s ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm font-medium' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'" @click="currentStep = s">
        Step {{ s }}
      </button>
    </div>

    <!-- Step 1: Basic Info -->
    <div v-if="currentStep === 1" class="card p-6 bg-[var(--bg-card)] space-y-4">
      <h2 class="text-base font-medium text-[var(--text-primary)]">基础信息</h2>
      <div>
        <label class="block text-sm text-[var(--text-secondary)] mb-1">活动名称</label>
        <input v-model="name" maxlength="30" placeholder="限30字" class="input" :disabled="addonly" />
        </div>
        <div>
          <label class="block text-sm text-[var(--text-secondary)] mb-1">活动描述</label>
          <textarea v-model="description" rows="4" placeholder="描述活动规则、奖品等" class="input" :disabled="addonly" />
      </div>
      <!-- Cover upload -->
      <div>
        <label class="block text-sm text-[var(--text-secondary)] mb-1">封面图片</label>
        <div class="flex items-center gap-3">
          <label class="cursor-pointer px-4 py-2 rounded-full border border-solid border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
            选择图片
            <input type="file" accept="image/*" class="hidden" @change="uploadCover" />
          </label>
          <img v-if="cover" :src="cover" class="h-16 w-24 object-cover rounded-xl border border-solid border-[var(--border-color)]" />
          <button v-if="cover" class="text-xs text-red-500 hover:underline" @click="cover = ''">删除</button>
        </div>
      </div>
      <!-- Visibility -->
      <div class="pt-2 border-t-1 border-solid border-[var(--border-color)] space-y-3">
        <label class="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input v-model="isPublic" type="checkbox" class="accent-[var(--accent)]" />
          公开活动（显示在用户端发现页）
        </label>
        <div v-if="!isPublic" class="ml-6">
          <label class="block text-sm text-[var(--text-secondary)] mb-1">访问密码</label>
          <input v-model="accessPassword" type="text" placeholder="用户访问需输入此密码" class="w-full px-3 py-2 rounded-full border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm outline-none focus:border-[var(--accent)]" />
        </div>
        <label class="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input v-model="requireLogin" type="checkbox" class="accent-[var(--accent)]" />
          需登录才能参与抽奖
        </label>
      </div>
    </div>

    <!-- Step 2: Mode & Rules -->
    <div v-if="currentStep === 2" class="card p-6 bg-[var(--bg-card)] space-y-4">
      <h2 class="text-base font-medium text-[var(--text-primary)]">抽奖模式与规则</h2>
      <div>
        <label class="block text-sm text-[var(--text-secondary)] mb-2">抽奖模式</label>
        <div class="flex gap-3">
          <button v-for="m in ([{ v: 'wheel', l: '转盘' }, { v: 'blindbox', l: '盲盒' }, { v: 'paper', l: '纸条' }])" :key="m.v"
            class="flex-1 px-4 py-3 rounded-full border-1 border-solid text-sm transition-all font-medium"
            :class="mode === m.v ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : (addonly ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 border-[var(--border-color)] cursor-not-allowed' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--accent)]')"
            :disabled="addonly"
            @click="addonly ? null : (mode = m.v as any)">
            {{ m.l }}
          </button>
        </div>
        <p class="text-xs text-[var(--text-muted)] text-center mt-1">
          {{ { wheel: '🎡 转盘：指针旋转抽奖，适合即时开奖、奖品分级投放', blindbox: '📦 盲盒：开箱翻转抽奖，适合收集玩法、保底机制', paper: '📝 纸条：多人填写题目（如下周广播站放什么歌？），然后按照设定规则统一开奖。适合互动问卷、社群活动' }[mode] }}
        </p>
      </div>

      <!-- Blind box settings -->
      <div v-if="mode === 'blindbox'" class="space-y-3 pt-2">
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm text-[var(--text-secondary)] mb-1">盲盒显示数量</label>
            <input v-model.number="blindBoxGridSize" type="number" min="1" max="100" class="input" />
          </div>
          <div class="flex-1">
            <label class="block text-sm text-[var(--text-secondary)] mb-1">可开启盲盒数量</label>
            <input v-model.number="blindBoxOpenable" type="number" min="1" :max="blindBoxGridSize" class="input" />
          </div>
        </div>
      </div>

      <!-- Paper slip settings -->
      <div v-if="mode === 'paper'" class="space-y-3 pt-2">
        <div>
          <label class="block text-sm text-[var(--text-secondary)] mb-1">填空题内容（用户需填写的题目）</label>
          <textarea v-model="paperQuestion" rows="3" placeholder="例：你最喜欢的一本书是什么？" class="input resize-y" />
        </div>
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm text-[var(--text-secondary)] mb-1">开奖奖品数量</label>
            <input v-model.number="paperPrizeCount" type="number" min="1" class="input" />
          </div>
        </div>
        <div>
          <label class="block text-sm text-[var(--text-secondary)] mb-2">开奖触发方式</label>
          <div class="flex gap-3">
            <button class="flex-1 px-4 py-2.5 rounded-full border-1 border-solid text-sm transition-all font-medium" :class="paperDrawTrigger === 'time' ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)]'" @click="paperDrawTrigger = 'time'">定时开奖</button>
            <button class="flex-1 px-4 py-2.5 rounded-full border-1 border-solid text-sm transition-all font-medium" :class="paperDrawTrigger === 'count' ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)]'" @click="paperDrawTrigger = 'count'">满人开奖</button>
            <button class="flex-1 px-4 py-2.5 rounded-full border-1 border-solid text-sm transition-all font-medium" :class="paperDrawTrigger === 'manual' ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)]'" @click="paperDrawTrigger = 'manual'">手动开奖</button>
          </div>
        </div>
        <div v-if="paperDrawTrigger === 'time'">
          <label class="block text-sm text-[var(--text-secondary)] mb-1">开奖时间</label>
          <input v-model="paperDrawTime" type="datetime-local" class="input" />
        </div>
        <div v-if="paperDrawTrigger === 'count'">
          <label class="block text-sm text-[var(--text-secondary)] mb-1">达到参与人数后开奖</label>
          <input v-model.number="paperDrawCount" type="number" min="1" class="input" />
        </div>
      </div>

      <div v-if="mode !== 'paper'" class="flex gap-4">
        <div class="flex-1">
          <label class="block text-sm text-[var(--text-secondary)] mb-1">每日抽奖次数上限</label>
          <input v-model="dailyLimit" type="number" min="0" placeholder="0=不限" class="input" />
        </div>
        <div class="flex-1">
          <label class="block text-sm text-[var(--text-secondary)] mb-1">总抽奖次数上限</label>
          <input v-model="drawLimit" type="number" min="0" placeholder="0=不限" class="input" />
        </div>
      </div>

      <!-- Time settings (wheel & blindbox only) -->
      <div v-if="mode === 'wheel' || mode === 'blindbox'" class="space-y-3">
        <div class="flex gap-4 items-start">
          <div class="flex-1">
            <label class="block text-sm text-[var(--text-secondary)] mb-1">开始时间</label>
            <input v-model="startTime" type="datetime-local" :disabled="permanent" class="input" />
          </div>
          <div class="flex-1">
            <label class="block text-sm text-[var(--text-secondary)] mb-1">结束时间</label>
            <input v-model="endTime" type="datetime-local" :disabled="permanent" class="input" />
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input v-model="permanent" type="checkbox" class="accent-[var(--accent)]" />
          永久有效
        </label>
      </div>
    </div>

    <!-- Step 3: IP & Rate Limits -->
    <div v-if="currentStep === 3" class="card p-6 bg-[var(--bg-card)] space-y-5">
      <h2 class="text-base font-medium text-[var(--text-primary)]">风控与安全</h2>

      <div>
        <label class="block text-sm text-[var(--text-secondary)] mb-1">同IP每日最多参与次数</label>
        <input v-model.number="ipDailyLimit" type="number" min="0" placeholder="0=不限" class="input w-40" />
      </div>

      <div>
        <label class="block text-sm text-[var(--text-secondary)] mb-1">IP访问频率限制</label>
        <div class="flex items-center gap-2">
          <input v-model.number="ipRateValue" type="number" min="1" class="input w-24" />
          <span class="text-sm text-[var(--text-muted)]">次 /</span>
          <select v-model="ipRateUnit" class="input w-auto">
            <option value="second">每秒</option>
            <option value="minute">每分钟</option>
            <option value="hour">每小时</option>
            <option value="day">每天</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm text-[var(--text-secondary)] mb-1">账号频率控制</label>
        <div class="flex items-center gap-2">
          <input v-model.number="userRateValue" type="number" min="1" class="input w-24" />
          <span class="text-sm text-[var(--text-muted)]">次 /</span>
          <select v-model="userRateUnit" class="input w-auto">
            <option value="second">每秒</option>
            <option value="minute">每分钟</option>
            <option value="hour">每小时</option>
            <option value="day">每天</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Step 4: Prizes (hidden for paper mode) -->
    <div v-if="currentStep === 4 && mode !== 'paper'" class="card p-6 bg-[var(--bg-card)] space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-medium text-[var(--text-primary)]">奖品与发放</h2>
        <button class="text-sm text-[var(--accent)] hover:underline" @click="addPrize">+ 添加奖品</button>
      </div>
      <div v-for="(p, i) in prizes" :key="i" class="p-4 rounded-2xl bg-[var(--bg-secondary)] space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-[var(--text-secondary)]">奖品 #{{ i + 1 }}</span>
          <button v-if="!addonly || !p.id" class="text-xs text-red-500 hover:underline" @click="removePrize(i)">删除</button>
          <span v-if="p.id" class="text-xs text-[var(--text-muted)]">已保存</span>
        </div>

        <!-- Editing: show input fields -->
        <template v-if="!addonly || !p.id">
          <input v-model="p.name" placeholder="奖品名称" class="input" />
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="text-xs text-[var(--text-muted)]">库存</label>
              <input v-model="p.stock" type="number" min="0" class="input" />
            </div>
            <div class="flex-1">
              <label class="text-xs text-[var(--text-muted)]">权重</label>
              <input v-model="p.weight" type="number" min="1" class="input" />
            </div>
            <div class="flex-1">
              <label class="text-xs text-[var(--text-muted)]">权重</label>
              <input v-model="p.weight" type="number" min="1" class="input" />
            </div>
          </div>
          <div>
            <label class="text-xs text-[var(--text-muted)]">奖品图片</label>
            <div class="flex items-center gap-3 mt-1">
              <label class="cursor-pointer px-3 py-1.5 rounded-full border border-solid border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
                选择图片
                <input type="file" accept="image/*" class="hidden" @change="(e) => uploadPrizeImage(p, e)" />
              </label>
              <img v-if="p.image" :src="p.image" class="h-12 w-16 object-cover rounded-lg border border-solid border-[var(--border-color)]" />
              <button v-if="p.image" class="text-xs text-red-500 hover:underline" @click="p.image = ''">删除</button>
            </div>
          </div>
          <div>
            <label class="text-xs text-[var(--text-muted)]">奖品说明</label>
            <MarkdownEditor v-model="p.description" />
          </div>
        </template>
        <!-- Read-only: show text -->
        <div v-else class="space-y-1">
          <p class="text-sm text-[var(--text-primary)]">{{ p.name }}</p>
          <p class="text-xs text-[var(--text-muted)]">库存 {{ p.stock }} · 权重 {{ p.weight }}</p>
          <p v-if="p.description" class="text-xs text-[var(--text-secondary)]">{{ p.description.substring(0, 50) }}{{ p.description.length > 50 ? '...' : '' }}</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex justify-between mt-6">
      <button v-if="currentStep > 1" class="btn-secondary text-sm" @click="currentStep--">上一步</button>
      <div v-else />
      <button v-if="currentStep < (mode === 'paper' ? 3 : 4)" class="btn-primary text-sm" @click="currentStep === 2 ? (showStep2Confirm = true) : currentStep++">下一步</button>
      <button v-else class="btn-primary text-sm" :disabled="loading" @click="submit">{{ loading ? '保存中...' : editId ? '保存修改' : '创建活动' }}</button>
    </div>

    <!-- Step 2 confirmation modal -->
    <Teleport to="body">
      <div v-if="showStep2Confirm" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" @click.self="showStep2Confirm = false">
        <div class="w-full max-w-sm mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md p-6">
          <h3 class="text-base font-semibold text-[var(--text-primary)] text-center">确认抽奖规则</h3>
          <div class="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
            <p>当前模式为：<span class="text-[var(--text-primary)] font-medium">{{ { wheel: '转盘模式', blindbox: '盲盒模式', paper: '纸条模式' }[mode] }}</span></p>
            <template v-if="mode !== 'paper'">
              <p>开奖方式：<span class="text-[var(--text-primary)] font-medium">{{ permanent ? '永久有效' : (startTime || endTime) ? (startTime ? '从 ' + startTime : '') + (endTime ? ' 到 ' + endTime : '') : '未设置时间' }}</span></p>
              <p>每人总抽奖次数：<span class="text-[var(--text-primary)] font-medium">{{ drawLimit || '无限制' }}</span></p>
              <p>每日抽奖次数：<span class="text-[var(--text-primary)] font-medium">{{ dailyLimit || '无限制' }}</span></p>
            </template>
            <template v-if="mode === 'paper'">
              <p>问题：<span class="text-[var(--text-primary)] font-medium">{{ paperQuestion || '未设置' }}</span></p>
              <p>开奖触发：<span class="text-[var(--text-primary)] font-medium">{{ { time: '定时开奖', count: '满人开奖', manual: '手动开奖' }[paperDrawTrigger] }}</span></p>
              <p v-if="paperDrawTrigger === 'time'">开奖时间：<span class="text-[var(--text-primary)] font-medium">{{ paperDrawTime || '未设置' }}</span></p>
              <p v-if="paperDrawTrigger === 'count'">目标人数：<span class="text-[var(--text-primary)] font-medium">{{ paperDrawCount }}</span></p>
            </template>
          </div>
          <div class="flex items-center gap-3 mt-5">
            <button class="btn-secondary flex-1 py-2.5 text-sm" @click="showStep2Confirm = false">返回修改</button>
            <button class="btn-primary flex-1 py-2.5 text-sm" @click="showStep2Confirm = false; currentStep++">确认，下一步</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Lottery code display after creation -->
    <div v-if="showLotteryCode" class="mt-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border-1 border-solid border-[var(--border-color)] text-center">
      <p class="text-xs text-[var(--text-muted)]">抽奖编号（用户可通过此编号加入抽奖）</p>
      <p class="text-lg font-mono font-bold tracking-widest text-[var(--accent)] mt-1">{{ createdLotteryCode }}</p>
      <button class="text-xs text-[var(--accent)] hover:underline mt-1" @click="copyLotteryCode">复制编号</button>
      </div>
    </div>
</template>