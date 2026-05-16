<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

interface BanForm {
  reason: string
  banIp: boolean
  banDays: number
  globalNotify: boolean
}

interface DeleteForm {
  reason: string
  banIp: boolean
  banDays: number
  globalNotify: boolean
}

const users = ref<any[]>([])
const total = ref(0)
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const showBanModal = ref(false)
const banTarget = ref<any>(null)
const banForm = ref<BanForm>({ reason: '', banIp: true, banDays: 5, globalNotify: false })
const showDeleteModal = ref(false)
const deleteTarget = ref<any>(null)
const deleteForm = ref<DeleteForm>({ reason: '', banIp: false, banDays: 0, globalNotify: false })
const showIpModal = ref(false)
const ipList = ref<any[]>([])

async function load() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize, search: search.value || undefined }
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await api.get('/admin/users', { params })
    users.value = data.items || []
    total.value = data.total || 0
  } catch { /* ignore */ }
  finally { loading.value = false }
}

function openBan(user: any) {
  banTarget.value = user
  banForm.value = { reason: '', banIp: true, banDays: 5, globalNotify: false }
  showBanModal.value = true
}

async function confirmBan() {
  try {
    await api.post(`/admin/users/${banTarget.value.id}/ban`, banForm.value)
    showBanModal.value = false
    await load()
  } catch (e: any) { alert(e.response?.data?.message || '操作失败') }
}

async function confirmUnban(userId: number) {
  try {
    await api.post(`/admin/users/${userId}/unban`)
    await load()
  } catch (e: any) { alert(e.response?.data?.message || '操作失败') }
}

function openDelete(user: any) {
  deleteTarget.value = user
  deleteForm.value = { reason: '', banIp: false, banDays: 0, globalNotify: false }
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deleteForm.value.reason) { alert('请输入删除理由'); return }
  try {
    await api.delete(`/admin/users/${deleteTarget.value.id}`, { data: deleteForm.value })
    showDeleteModal.value = false
    await load()
  } catch (e: any) { alert(e.response?.data?.message || '操作失败') }
}

async function loadIpList() {
  try {
    const { data } = await api.get('/admin/ip-blacklist')
    ipList.value = data || []
  } catch { /* ignore */ }
}

async function unbanIp(id: number) {
  try {
    await api.delete(`/admin/ip-blacklist/${id}`)
    await loadIpList()
  } catch (e: any) { alert(e.response?.data?.message || '操作失败') }
}

function openIpModal() {
  loadIpList()
  showIpModal.value = true
}

function onSearch() {
  page.value = 1
  load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-[var(--text-primary)]">用户管理</h1>
      <button class="text-sm text-[var(--accent)] hover:underline" @click="openIpModal">IP黑名单</button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" placeholder="搜索用户名..." class="px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] w-48" @keyup.enter="onSearch" />
      <select v-model="statusFilter" class="px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none" @change="onSearch">
        <option value="">全部状态</option>
        <option value="active">正常</option>
        <option value="banned">封禁</option>
      </select>
      <span class="text-xs text-[var(--text-muted)] self-center">共 {{ total }} 人</span>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden bg-[var(--bg-card)]">
      <div v-if="loading" class="p-8 text-center text-sm text-[var(--text-muted)]">加载中...</div>
      <div v-else-if="users.length === 0" class="p-8 text-center text-sm text-[var(--text-muted)]">暂无用户</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="bg-[var(--bg-secondary)] text-left">
            <th class="px-4 py-3 text-[var(--text-secondary)]">用户名</th>
            <th class="px-4 py-3 text-[var(--text-secondary)] hidden md:table-cell">角色</th>
            <th class="px-4 py-3 text-[var(--text-secondary)]">状态</th>
            <th class="px-4 py-3 text-[var(--text-secondary)] hidden lg:table-cell">注册时间</th>
            <th class="px-4 py-3 text-[var(--text-secondary)]">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-t-1 border-solid border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
            <td class="px-4 py-3 text-[var(--text-primary)]">{{ u.username }}</td>
            <td class="px-4 py-3 hidden md:table-cell">
              <span class="text-xs px-2 py-1 rounded-4px" :class="u.isAdmin ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'">
                {{ u.isAdmin ? '管理员' : '用户' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span v-if="u.isBanned" class="text-xs px-2 py-1 rounded-4px bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">封禁</span>
              <span v-else class="text-xs px-2 py-1 rounded-4px bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">正常</span>
              <p v-if="u.isBanned && u.banReason" class="text-xs text-[var(--text-muted)] mt-0.5">{{ u.banReason }}</p>
            </td>
            <td class="px-4 py-3 text-[var(--text-muted)] hidden lg:table-cell">{{ new Date(u.createdAt).toLocaleDateString('zh-CN') }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2 flex-wrap">
                <button v-if="!u.isAdmin && !u.isBanned" class="text-xs text-yellow-500 hover:underline" @click="openBan(u)">封禁</button>
                <button v-if="u.isBanned" class="text-xs text-green-500 hover:underline" @click="confirmUnban(u.id)">解封</button>
                <button v-if="!u.isAdmin" class="text-xs text-red-500 hover:underline" @click="openDelete(u)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Ban Modal -->
    <Teleport to="body">
      <div v-if="showBanModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" @click.self="showBanModal = false">
        <div class="w-full max-w-md mx-4 bg-[var(--bg-card)] rounded-12px shadow-md overflow-hidden">
          <div class="px-6 py-4 border-b-1 border-solid border-[var(--border-color)]">
            <h3 class="text-base font-semibold text-[var(--text-primary)]">封禁用户 - {{ banTarget?.username }}</h3>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1">封禁理由</label>
              <textarea v-model="banForm.reason" rows="2" class="w-full px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm outline-none focus:border-[var(--accent)] resize-y"></textarea>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="banForm.banIp" type="checkbox" class="accent-[var(--accent)]" /> 加入IP黑名单
            </label>
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1">封禁天数（-1为永久）</label>
              <input v-model.number="banForm.banDays" type="number" min="-1" class="w-full px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm outline-none focus:border-[var(--accent)]" />
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="banForm.globalNotify" type="checkbox" class="accent-[var(--accent)]" /> 全站通告
            </label>
          </div>
          <div class="px-6 py-4 border-t-1 border-solid border-[var(--border-color)] flex justify-end gap-3">
            <button class="px-4 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] text-sm" @click="showBanModal = false">取消</button>
            <button class="px-4 py-2 rounded-8px bg-red-500 text-white text-sm hover:bg-red-600" @click="confirmBan">确认封禁</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" @click.self="showDeleteModal = false">
        <div class="w-full max-w-md mx-4 bg-[var(--bg-card)] rounded-12px shadow-md overflow-hidden">
          <div class="px-6 py-4 border-b-1 border-solid border-[var(--border-color)]">
            <h3 class="text-base font-semibold text-[var(--text-primary)]">删除用户 - {{ deleteTarget?.username }}</h3>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1">删除理由 <span class="text-red-500">*</span></label>
              <textarea v-model="deleteForm.reason" rows="2" class="w-full px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm outline-none focus:border-[var(--accent)] resize-y"></textarea>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="deleteForm.banIp" type="checkbox" class="accent-[var(--accent)]" /> 同时封禁IP
            </label>
            <div v-if="deleteForm.banIp">
              <label class="block text-sm text-[var(--text-secondary)] mb-1">封禁天数（-1为永久）</label>
              <input v-model.number="deleteForm.banDays" type="number" min="-1" class="w-full px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm outline-none focus:border-[var(--accent)]" />
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="deleteForm.globalNotify" type="checkbox" class="accent-[var(--accent)]" /> 全站通告
            </label>
          </div>
          <div class="px-6 py-4 border-t-1 border-solid border-[var(--border-color)] flex justify-end gap-3">
            <button class="px-4 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] text-sm" @click="showDeleteModal = false">取消</button>
            <button class="px-4 py-2 rounded-8px bg-red-500 text-white text-sm hover:bg-red-600" @click="confirmDelete">确认删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- IP Blacklist Modal -->
    <Teleport to="body">
      <div v-if="showIpModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" @click.self="showIpModal = false">
        <div class="w-full max-w-2xl mx-4 bg-[var(--bg-card)] rounded-12px shadow-md overflow-hidden">
          <div class="px-6 py-4 border-b-1 border-solid border-[var(--border-color)] flex items-center justify-between">
            <h3 class="text-base font-semibold text-[var(--text-primary)]">IP黑名单</h3>
            <button class="text-[var(--text-muted)] hover:text-[var(--text-primary)]" @click="showIpModal = false">✕</button>
          </div>
          <div class="px-6 py-4 max-h-96 overflow-y-auto">
            <div v-if="ipList.length === 0" class="text-sm text-[var(--text-muted)] text-center py-8">暂无封禁IP</div>
            <table v-else class="w-full text-sm">
              <thead>
                <tr class="text-left text-[var(--text-secondary)]">
                  <th class="pb-2">IP</th>
                  <th class="pb-2 hidden md:table-cell">原因</th>
                  <th class="pb-2 hidden md:table-cell">封禁时间</th>
                  <th class="pb-2">解封</th>
                  <th class="pb-2">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ip in ipList" :key="ip.id" class="border-t-1 border-solid border-[var(--border-color)]">
                  <td class="py-2 text-[var(--text-primary)] font-mono text-xs">{{ ip.ip }}</td>
                  <td class="py-2 text-[var(--text-muted)] hidden md:table-cell text-xs">{{ ip.reason }}</td>
                  <td class="py-2 text-[var(--text-muted)] hidden md:table-cell text-xs">{{ new Date(ip.createdAt).toLocaleDateString('zh-CN') }}</td>
                  <td class="py-2 text-[var(--text-muted)] text-xs">
                    <span v-if="!ip.unbanAt" class="text-red-500 font-medium">永久</span>
                    <span v-else>{{ new Date(ip.unbanAt).toLocaleDateString('zh-CN') }}</span>
                  </td>
                  <td class="py-2">
                    <button class="text-xs text-green-500 hover:underline" @click="unbanIp(ip.id)">解封</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>