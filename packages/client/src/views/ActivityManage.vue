<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activities = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const pageSize = 20

// Publish prompt modal
const showPublishModal = ref(false)
const createdId = ref<number | null>(null)

// Edit mode modal
const showEditModal = ref(false)
const editingActivity = ref<any>(null)
const showForceEndModal = ref(false)
const forceEndTarget = ref<any>(null)
const forceEndReason = ref('')

onMounted(async () => {
  if (route.query.created) {
    createdId.value = Number(route.query.created)
    showPublishModal.value = true
    // Clean URL so modal doesn't reappear on revisit
    router.replace('/activities/manageact')
  }
  await load()
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/activities', { params: { page: page.value, pageSize } })
    activities.value = data.items || []
    total.value = data.total || 0
  } catch { /* ignore */ }
  finally { loading.value = false }
}

function goPage(p: number) {
  page.value = p
  load()
}

async function publish(id: number) {
  try { await api.patch(`/activities/${id}/status`, { status: 'active' }); showPublishModal.value = false; await load() }
  catch (e: any) { alert(e.response?.data?.message || '发布失败') }
}

async function remove(id: number) {
  if (!confirm('确定删除该活动？')) return
  try { await api.delete(`/activities/${id}`); await load() }
  catch (e: any) { alert(e.response?.data?.message || '删除失败') }
}

async function convertToDraft(id: number) {
  try { await api.patch(`/activities/${id}/status`, { status: 'draft' }); await load() }
  catch (e: any) { alert(e.response?.data?.message || '转换失败') }
}

function openEdit(act: any) {
  editingActivity.value = act
  showEditModal.value = true
}

async function editAddOnly() {
  showEditModal.value = false
  // Auto-convert to draft to prevent entries during edit
  await api.patch(`/activities/${editingActivity.value.id}/status`, { status: 'draft' })
  router.push(`/activities/manageact/${editingActivity.value.id}/edit?mode=addonly`)
}

function openForceEnd(act: any) {
  forceEndTarget.value = act
  forceEndReason.value = ''
  showForceEndModal.value = true
}

async function confirmForceEnd() {
  if (!forceEndReason.value.trim()) { alert('请输入强制结束理由'); return }
  try {
    await api.post(`/activities/${forceEndTarget.value.id}/force-end`, { reason: forceEndReason.value })
    showForceEndModal.value = false
    await load()
  } catch (e: any) { alert(e.response?.data?.message || '操作失败') }
}

async function editClone() {
  const orig = editingActivity.value
  showEditModal.value = false
  try {
    const { data } = await api.post('/activities', {
      name: orig.name + ' (副本)', description: orig.description, mode: orig.mode,
      isPublic: orig.isPublic, requireLogin: orig.requireLogin,
      accessPassword: orig.accessPassword,
    })
    // Clone prizes
    const { data: prizes } = await api.get(`/prizes/activity/${orig.id}`)
    if (prizes.length) await api.post(`/prizes/bulk/${data.id}`, { prizes })
    // Redirect to edit page to review
    router.push(`/activities/manageact/${data.id}/edit`)
  } catch (e: any) { alert(e.response?.data?.message || '复制失败') }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-[var(--text-primary)]">我的活动</h1>
      <a href="/activities/manageact/create" class="btn-primary text-sm">+ 创建活动</a>
    </div>

    <div class="card overflow-hidden bg-[var(--bg-card)]">
      <div v-if="loading" class="p-8 text-center text-sm text-[var(--text-muted)]">加载中...</div>
      <div v-else-if="activities.length === 0" class="p-8 text-center text-sm text-[var(--text-muted)]">暂无活动</div>
      <div v-else class="divide-y divide-solid divide-[var(--border-color)]">
        <div v-for="act in activities" :key="act.id" class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)]">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm text-[var(--text-primary)] font-medium">{{ act.name }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full" :class="{
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': act.status === 'active',
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': act.status === 'draft',
                'bg-gray-100 text-gray-500 dark:bg-gray-800': ['ended','paused'].includes(act.status),
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': act.status === 'pending',
              }              ">{{ ({ draft:'草稿', pending:'待发布', active:'进行中', paused:'已暂停', ended:'已结束' } as Record<string, string>)[act.status] || act.status }}</span>
              <span class="text-xs text-[var(--text-muted)]">#{{ act.lotteryCode }}</span>
            </div>
          </div>
          <div class="flex gap-1.5 shrink-0 flex-wrap">
            <button v-if="act.status === 'active'" class="btn-primary text-xs px-3 py-1.5" @click="router.push('/activity/' + act.id)">进入</button>
            <button class="btn-secondary text-xs px-3 py-1.5" @click="router.push('/share/' + act.id)">分享</button>
            <button v-if="act.status === 'draft'" class="btn-primary text-xs px-3 py-1.5" @click="publish(act.id)">发布</button>
            <button class="btn-secondary text-xs px-3 py-1.5" @click="openEdit(act)">编辑</button>
            <button v-if="act.status === 'active'" class="btn-secondary text-xs px-3 py-1.5" @click="convertToDraft(act.id)">转草稿</button>
            <button v-if="act.status === 'active'" class="btn-secondary text-xs px-3 py-1.5 hover:bg-red-500 hover:text-white hover:border-red-500" @click="openForceEnd(act)">强制结束</button>
            <button class="btn-secondary text-xs px-3 py-1.5 hover:bg-red-500 hover:text-white hover:border-red-500" @click="remove(act.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex items-center justify-center gap-2 mt-4">
      <button class="btn-secondary text-xs px-3 py-1.5" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
      <span class="text-sm text-[var(--text-muted)]">第 {{ page }} / {{ Math.ceil(total / pageSize) }} 页</span>
      <button class="btn-secondary text-xs px-3 py-1.5" :disabled="page >= Math.ceil(total / pageSize)" @click="goPage(page + 1)">下一页</button>
    </div>

    <!-- Publish prompt modal -->
    <Teleport to="body">
      <div v-if="showPublishModal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" @click.self="showPublishModal = false">
        <div class="w-full max-w-sm mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md p-6 text-center">
          <span class="text-3xl">🎉</span>
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mt-3">活动已创建</h3>
          <p class="text-sm text-[var(--text-secondary)] mt-2">当前为草稿状态，发布后可被用户参与。<br>发布后编辑将受限（仅支持新增奖品）。</p>
          <div class="flex items-center gap-3 mt-6">
            <button class="flex-1 btn-primary py-2.5 text-sm" @click="createdId && publish(createdId)">发布活动</button>
            <button class="flex-1 btn-secondary py-2.5 text-sm" @click="showPublishModal = false">继续编辑</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit mode modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" @click.self="showEditModal = false">
        <div class="w-full max-w-sm mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] text-center">编辑活动</h3>
          <p class="text-xs text-[var(--text-muted)] text-center mt-1">为维护公平性，目前支持以下2种编辑模式</p>
          <div class="mt-5 space-y-3">
            <button class="w-full p-4 rounded-xl border border-solid border-[var(--border-color)] text-left hover:border-[var(--accent)] transition-all" @click="editAddOnly">
              <p class="text-sm font-medium text-[var(--text-primary)]">只增不减</p>
              <p class="text-xs text-[var(--text-muted)] mt-1">可新增奖品，不可删除原有项目。活动名称/描述/模式不可修改。访问链接不变。</p>
            </button>
            <button class="w-full p-4 rounded-xl border border-solid border-[var(--border-color)] text-left hover:border-[var(--accent)] transition-all" @click="editClone">
              <p class="text-sm font-medium text-[var(--text-primary)]">创建副本抽奖</p>
              <p class="text-xs text-[var(--text-muted)] mt-1">清空抽奖记录，保留奖品与规则。自由编辑所有内容。访问链接变化，相当于全新抽奖。</p>
            </button>
          </div>
          <button class="btn-secondary w-full py-2.5 text-sm mt-4" @click="showEditModal = false">取消</button>
        </div>
      </div>
    </Teleport>

    <!-- Force End Modal -->
    <Teleport to="body">
      <div v-if="showForceEndModal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" @click.self="showForceEndModal = false">
        <div class="w-full max-w-sm mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] text-center">强制结束抽奖</h3>
          <p class="text-xs text-[var(--text-muted)] text-center mt-1">结束后用户无法继续参与，详情页将显示结束理由</p>
          <div class="mt-4">
            <label class="block text-sm text-[var(--text-secondary)] mb-1">结束理由 <span class="text-red-500">*</span></label>
            <textarea v-model="forceEndReason" rows="3" placeholder="请输入强制结束的理由" class="input resize-y"></textarea>
          </div>
          <div class="flex items-center gap-3 mt-5">
            <button class="btn-secondary flex-1 py-2.5 text-sm" @click="showForceEndModal = false">取消</button>
            <button class="flex-1 py-2.5 text-sm rounded-full bg-red-500 text-white hover:bg-red-600 transition-all" @click="confirmForceEnd">确认结束</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>