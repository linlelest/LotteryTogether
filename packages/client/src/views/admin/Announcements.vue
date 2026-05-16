<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const announcements = ref<any[]>([])
const loading = ref(false)
const showEditor = ref(false)
const editingItem = ref<any>(null)
const dragIndex = ref<number | null>(null)

// Editor form
const title = ref('')
const content = ref('')
const forceRead = ref(false)
const forceReadSeconds = ref(10)
const showDismiss = ref(true)
const isPinned = ref(false)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/announcements')
    announcements.value = data || []
  } catch { /* ignore */ }
  finally { loading.value = false }
}

function openCreate() {
  editingItem.value = null
  title.value = ''
  content.value = ''
  forceRead.value = false
  forceReadSeconds.value = 10
  showDismiss.value = true
  isPinned.value = false
  showEditor.value = true
}

function openEdit(item: any) {
  editingItem.value = item
  title.value = item.title
  content.value = item.content
  forceRead.value = item.forceRead
  forceReadSeconds.value = item.forceReadSeconds || 10
  showDismiss.value = item.showDismiss
  isPinned.value = item.isPinned
  showEditor.value = true
}

async function save() {
  if (!title.value) { alert('请输入标题'); return }
  try {
    const body = { title: title.value, content: content.value, forceRead: forceRead.value, forceReadSeconds: forceReadSeconds.value, showDismiss: showDismiss.value, isPinned: isPinned.value }
    if (editingItem.value) {
      await api.patch(`/admin/announcements/${editingItem.value.id}`, body)
    } else {
      await api.post('/admin/announcements', body)
    }
    showEditor.value = false
    await load()
  } catch (e: any) { alert(e.response?.data?.message || '保存失败') }
}

async function remove(id: number) {
  if (!confirm('确定删除此公告？')) return
  try {
    await api.delete(`/admin/announcements/${id}`)
    await load()
  } catch (e: any) { alert(e.response?.data?.message || '删除失败') }
}

// Drag sort
function onDragStart(index: number) {
  dragIndex.value = index
}
function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) return
  const item = announcements.value.splice(dragIndex.value, 1)[0]
  announcements.value.splice(index, 0, item)
  dragIndex.value = null
  // Save order
  api.post('/admin/announcements/sort', { ids: announcements.value.map((a: any) => a.id) }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-[var(--text-primary)]">公告管理</h1>
      <button class="btn-primary text-sm" @click="openCreate">+ 新建公告</button>
    </div>

    <!-- Editor -->
    <div v-if="showEditor" class="card p-6 bg-[var(--bg-card)] mb-6 space-y-4">
      <h2 class="text-base font-medium text-[var(--text-primary)]">{{ editingItem ? '编辑公告' : '新建公告' }}</h2>
      <div>
        <label class="block text-sm text-[var(--text-secondary)] mb-1">标题</label>
        <input v-model="title" maxlength="100" class="w-full px-3 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
      </div>
      <div>
        <label class="block text-sm text-[var(--text-secondary)] mb-1">内容</label>
        <MarkdownEditor v-model="content" />
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
          <input v-model="forceRead" type="checkbox" class="accent-[var(--accent)] rounded" /> 强制阅读
        </label>
        <div v-if="forceRead" class="flex items-center gap-2">
          <input v-model.number="forceReadSeconds" type="number" min="1" class="input w-20" />
          <span class="text-xs text-[var(--text-muted)]">秒</span>
        </div>
        <label class="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
          <input v-model="showDismiss" type="checkbox" class="accent-[var(--accent)] rounded" /> 显示"不再提示"
        </label>
        <label class="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
          <input v-model="isPinned" type="checkbox" class="accent-[var(--accent)] rounded" /> 置顶
        </label>
      </div>
      <div class="flex gap-3">
        <button class="btn-primary text-sm" @click="save">保存</button>
        <button class="px-4 py-2 rounded-8px border-1 border-solid border-[var(--border-color)] text-sm text-[var(--text-secondary)]" @click="showEditor = false">取消</button>
      </div>
    </div>

    <!-- List -->
    <div class="card overflow-hidden bg-[var(--bg-card)]">
      <div v-if="loading" class="p-8 text-center text-sm text-[var(--text-muted)]">加载中...</div>
      <div v-else-if="announcements.length === 0" class="p-8 text-center text-sm text-[var(--text-muted)]">暂无公告</div>
      <div v-else class="divide-y-1 divide-[var(--border-color)]">
        <div
          v-for="(item, idx) in announcements" :key="item.id"
          class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] cursor-grab"
          draggable="true"
          @dragstart="onDragStart(idx)"
          @dragover.prevent
          @drop="onDrop(idx)"
        >
          <span class="text-[var(--text-muted)] cursor-grab text-sm">⠿</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm text-[var(--text-primary)] truncate">{{ item.title }}</span>
              <span v-if="item.isPinned" class="text-xs px-1.5 py-0.5 rounded-4px bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shrink-0">置顶</span>
              <span v-if="item.forceRead" class="text-xs px-1.5 py-0.5 rounded-4px bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 shrink-0">强制</span>
            </div>
            <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ new Date(item.createdAt).toLocaleDateString('zh-CN') }}</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button class="text-xs text-[var(--accent)] hover:underline" @click="openEdit(item)">编辑</button>
            <button class="text-xs text-red-500 hover:underline" @click="remove(item.id)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>