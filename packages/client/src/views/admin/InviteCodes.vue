<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const codes = ref<any[]>([])
const users = ref<any[]>([])
const loading = ref(false)

// Generate
const generateCount = ref(10)

// Assign modal
const showAssignModal = ref(false)
const selectedUserIds = ref<number[]>([])
const assignCount = ref(5)

// Settings
const inviteEnabled = ref(true)
const initialCodes = ref(3)
const inviteRewardCodes = ref(1)
const inviteHint = ref('')

// User filter
const userSearch = ref('')
const filteredUsers = computed(() => {
  if (!userSearch.value) return users.value
  return users.value.filter((u: any) => u.username.includes(userSearch.value))
})

async function load() {
  loading.value = true
  try {
    const { data: c } = await api.get('/admin/invite-codes')
    codes.value = c || []
    const { data: u } = await api.get('/admin/users')
    users.value = u?.items || u || []
    const { data: settings } = await api.get('/admin/settings')
    for (const s of settings) {
      if (s.key === 'inviteEnabled') inviteEnabled.value = s.value !== 'false'
      if (s.key === 'initialCodes') initialCodes.value = Number(s.value)
      if (s.key === 'inviteRewardCodes') inviteRewardCodes.value = Number(s.value)
      if (s.key === 'inviteHint') inviteHint.value = s.value
    }
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function generate() {
  try {
    await api.post('/admin/invite-codes/generate', { count: generateCount.value })
    await load()
  } catch (e: any) { alert(e.response?.data?.message || '生成失败') }
}

async function removeCode(id: number) {
  try { await api.delete(`/admin/invite-codes/${id}`); await load() }
  catch (e: any) { alert(e.response?.data?.message || '删除失败') }
}

async function bulkDelete() {
  const ids = codes.value.filter((c: any) => !c.isUsed).map((c: any) => c.id)
  if (!ids.length || !confirm('删除所有未使用的邀请码？')) return
  try { await api.post('/admin/invite-codes/bulk-delete', { ids }); await load() }
  catch (e: any) { alert(e.response?.data?.message || '删除失败') }
}

function openAssign() {
  selectedUserIds.value = []
  userSearch.value = ''
  showAssignModal.value = true
}

function toggleUser(id: number) {
  const idx = selectedUserIds.value.indexOf(id)
  if (idx >= 0) selectedUserIds.value.splice(idx, 1)
  else selectedUserIds.value.push(id)
}

async function confirmAssign() {
  if (!selectedUserIds.value.length || assignCount.value < 1) return
  for (const userId of selectedUserIds.value) {
    try {
      await api.post('/admin/invite-codes/assign', { userId, count: assignCount.value })
    } catch { /* ignore */ }
  }
  showAssignModal.value = false
  alert(`已分配 ${assignCount.value} × ${selectedUserIds.value.length} 个邀请码`)
  await load()
}

async function saveSettings() {
  try {
    await api.patch('/admin/settings', {
      inviteEnabled: inviteEnabled.value ? 'true' : 'false',
      initialCodes: String(initialCodes.value),
      inviteRewardCodes: String(inviteRewardCodes.value),
      inviteHint: inviteHint.value,
    })
    alert('设置已保存')
  } catch (e: any) { alert(e.response?.data?.message || '保存失败') }
}

onMounted(load)
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-xl font-bold text-[var(--text-primary)] mb-6">邀请码管理</h1>

    <!-- Settings -->
    <div class="card p-5 bg-[var(--bg-card)] mb-6 space-y-4">
      <h2 class="text-sm font-semibold text-[var(--text-primary)]">系统设置</h2>
      <label class="flex items-center justify-between">
        <span class="text-sm text-[var(--text-primary)]">邀请码系统</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="inviteEnabled" class="sr-only peer" />
          <div class="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-[var(--accent)] transition-colors"></div>
          <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
        </label>
      </label>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-[var(--text-muted)] mb-1">新用户自带邀请码 (n)</label>
          <input v-model.number="initialCodes" type="number" min="0" class="input" />
        </div>
        <div>
          <label class="block text-xs text-[var(--text-muted)] mb-1">每邀请一人获得 (m)</label>
          <input v-model.number="inviteRewardCodes" type="number" min="0" class="input" />
        </div>
      </div>

      <!-- Hint editor -->
      <div>
        <label class="block text-xs text-[var(--text-muted)] mb-1">邀请码提示（注册页弹窗显示）</label>
        <MarkdownEditor v-model="inviteHint" />
      </div>

      <button class="btn-primary text-sm" @click="saveSettings">保存设置</button>
    </div>

    <!-- Generate + Assign -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card p-5 bg-[var(--bg-card)]">
        <h2 class="text-sm font-semibold text-[var(--text-primary)] mb-3">生成邀请码</h2>
        <div class="flex gap-3">
          <input v-model.number="generateCount" type="number" min="1" max="1000" class="input w-24" />
          <button class="btn-primary text-sm" @click="generate">生成</button>
          <button class="btn-secondary text-sm" @click="bulkDelete">清理未使用</button>
        </div>
      </div>
      <div class="card p-5 bg-[var(--bg-card)]">
        <h2 class="text-sm font-semibold text-[var(--text-primary)] mb-3">分配给用户</h2>
        <p class="text-xs text-[var(--text-muted)] mb-3">选择用户并指定数量，系统生成全新邀请码分配</p>
        <button class="btn-primary text-sm" @click="openAssign">选择用户并分配</button>
      </div>
    </div>

    <!-- Code list -->
    <div class="card overflow-hidden bg-[var(--bg-card)]">
      <div class="px-5 py-3 border-b-1 border-solid border-[var(--border-color)] flex items-center justify-between">
        <h2 class="text-sm font-semibold text-[var(--text-primary)]">邀请码列表</h2>
        <div class="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span>共 {{ codes.length }} 个</span>
          <span>未使用 {{ codes.filter((c: any) => !c.isUsed).length }}</span>
        </div>
      </div>
      <div v-if="loading" class="p-8 text-center text-sm text-[var(--text-muted)]">加载中...</div>
      <div v-else-if="codes.length === 0" class="p-8 text-center text-sm text-[var(--text-muted)]">暂无邀请码</div>
      <div v-else class="max-h-96 overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-[var(--text-secondary)] bg-[var(--bg-secondary)] sticky top-0">
            <tr>
              <th class="px-5 py-2">邀请码</th>
              <th class="px-5 py-2 hidden md:table-cell">状态</th>
              <th class="px-5 py-2 hidden md:table-cell">归属用户</th>
              <th class="px-5 py-2 hidden lg:table-cell">创建时间</th>
              <th class="px-5 py-2">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y-1 divide-[var(--border-color)]">
            <tr v-for="c in codes" :key="c.id" class="hover:bg-[var(--bg-secondary)]">
              <td class="px-5 py-2.5 font-mono text-[var(--text-primary)] text-xs">{{ c.code }}</td>
              <td class="px-5 py-2.5 hidden md:table-cell">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="c.isUsed ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'">{{ c.isUsed ? '已使用' : '未使用' }}</span>
              </td>
              <td class="px-5 py-2.5 hidden md:table-cell text-xs text-[var(--text-muted)]">{{ c.ownerId ? '用户 #' + c.ownerId : '-' }}</td>
              <td class="px-5 py-2.5 hidden lg:table-cell text-xs text-[var(--text-muted)]">{{ new Date(c.createdAt).toLocaleDateString('zh-CN') }}</td>
              <td class="px-5 py-2.5">
                <button v-if="!c.isUsed" class="text-xs text-red-500 hover:underline" @click="removeCode(c.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Assign Modal -->
    <Teleport to="body">
      <div v-if="showAssignModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" @click.self="showAssignModal = false">
        <div class="w-full max-w-lg mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md overflow-hidden">
          <div class="px-6 py-4 border-b-1 border-solid border-[var(--border-color)] flex items-center justify-between">
            <h3 class="text-base font-semibold text-[var(--text-primary)]">分配邀请码</h3>
            <button class="text-[var(--text-muted)] hover:text-[var(--text-primary)]" @click="showAssignModal = false">✕</button>
          </div>
          <div class="px-6 py-4">
            <p class="text-xs text-[var(--text-muted)] mb-3">选择用户并指定每人分配数量，系统将生成全新邀请码</p>
            <div class="mb-3">
              <input v-model="userSearch" placeholder="搜索用户名..." class="input" />
            </div>
            <div class="mb-3">
              <label class="block text-xs text-[var(--text-muted)] mb-1">每人分配数量</label>
              <input v-model.number="assignCount" type="number" min="1" class="input w-24" />
            </div>
            <div class="max-h-60 overflow-y-auto space-y-1 border-1 border-solid border-[var(--border-color)] rounded-2xl p-2">
              <div v-if="filteredUsers.length === 0" class="text-sm text-[var(--text-muted)] text-center py-4">暂无用户</div>
              <label v-for="u in filteredUsers" :key="u.id" class="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-[var(--bg-secondary)] cursor-pointer text-sm">
                <input type="checkbox" :checked="selectedUserIds.includes(u.id)" class="accent-[var(--accent)]" @change="toggleUser(u.id)" />
                <span class="text-[var(--text-primary)]">{{ u.username }}</span>
                <span v-if="u.isAdmin" class="text-xs text-[var(--accent)]">管理员</span>
              </label>
            </div>
          </div>
          <div class="px-6 py-4 border-t-1 border-solid border-[var(--border-color)] flex justify-end gap-3">
            <button class="btn-secondary text-sm" @click="showAssignModal = false">取消</button>
            <button class="btn-primary text-sm" :disabled="!selectedUserIds.length" @click="confirmAssign">
              分配 ({{ selectedUserIds.length }} 人 × {{ assignCount }})
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>