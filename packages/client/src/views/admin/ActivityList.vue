<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api'

const activities = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const statusFilter = ref('')
const modeFilter = ref('')

async function load() {
  loading.value = true
  try {
    const params: any = { pageSize: 50 }
    if (search.value) params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    if (modeFilter.value) params.mode = modeFilter.value
    const { data } = await api.get('/activities', { params })
    activities.value = data.items || []
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function changeStatus(id: number, status: string) {
  try {
    await api.patch(`/activities/${id}/status`, { status })
    await load()
  } catch (e: any) { alert(e.response?.data?.message || '操作失败') }
}

async function remove(id: number) {
  if (!confirm('确定删除该活动？')) return
  try {
    await api.delete(`/activities/${id}`)
    await load()
  } catch (e: any) { alert(e.response?.data?.message || '删除失败') }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-[var(--text-primary)]">活动管理</h1>
      <a href="/activities/manageact/create" class="btn-primary text-sm inline-block">+ 创建活动</a>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" placeholder="搜索活动名称..." class="px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] w-48" @keyup.enter="load">
      <select v-model="statusFilter" class="px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none" @change="load">
        <option value="">全部状态</option>
        <option value="draft">草稿</option>
        <option value="pending">待发布</option>
        <option value="active">进行中</option>
        <option value="paused">已暂停</option>
        <option value="ended">已结束</option>
      </select>
      <select v-model="modeFilter" class="px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none" @change="load">
        <option value="">全部模式</option>
        <option value="wheel">转盘</option>
        <option value="blindbox">盲盒</option>
        <option value="paper">纸条</option>
      </select>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden bg-[var(--bg-card)]">
      <div v-if="loading" class="p-8 text-center text-sm text-[var(--text-muted)]">加载中...</div>
      <div v-else-if="activities.length === 0" class="p-8 text-center text-sm text-[var(--text-muted)]">暂无活动</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="bg-[var(--bg-secondary)] text-left">
            <th class="px-4 py-3 text-[var(--text-secondary)]">名称</th>
            <th class="px-4 py-3 text-[var(--text-secondary)] hidden md:table-cell">模式</th>
            <th class="px-4 py-3 text-[var(--text-secondary)]">状态</th>
            <th class="px-4 py-3 text-[var(--text-secondary)] hidden lg:table-cell">创建时间</th>
            <th class="px-4 py-3 text-[var(--text-secondary)]">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="act in activities" :key="act.id" class="border-t-1 border-solid border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
            <td class="px-4 py-3 text-[var(--text-primary)]">{{ act.name }}</td>
            <td class="px-4 py-3 text-[var(--text-muted)] hidden md:table-cell">{{ ({ wheel: '转盘', blindbox: '盲盒', paper: '纸条' } as Record<string, string>)[act.mode] || act.mode }}</td>
            <td class="px-4 py-3">
              <span
                class="text-xs px-2 py-1 rounded-4px" :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': act.status === 'active',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': act.status === 'draft',
                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400': ['ended', 'paused'].includes(act.status),
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': act.status === 'pending',
                } "
              >{{ ({ draft: '草稿', pending: '待发布', active: '进行中', paused: '已暂停', ended: '已结束' } as Record<string, string>)[act.status] || act.status }}</span>
            </td>
            <td class="px-4 py-3 text-[var(--text-muted)] hidden lg:table-cell">{{ new Date(act.createdAt).toLocaleDateString('zh-CN') }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2 flex-wrap">
                <a :href="`/admin/activities/${act.id}/edit`" class="text-xs text-[var(--accent)] hover:underline">编辑</a>
                <button v-if="act.status === 'draft' || act.status === 'pending'" class="text-xs text-blue-500 hover:underline" @click="changeStatus(act.id, 'active')">发布</button>
                <button v-if="act.status === 'active'" class="text-xs text-yellow-500 hover:underline" @click="changeStatus(act.id, 'paused')">暂停</button>
                <button v-if="act.status !== 'ended'" class="text-xs text-gray-500 hover:underline" @click="changeStatus(act.id, 'ended')">结束</button>
                <button class="text-xs text-red-500 hover:underline" @click="remove(act.id)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>