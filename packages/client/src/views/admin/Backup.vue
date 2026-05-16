<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api'

const importing = ref(false)
const result = ref('')

async function download() {
  try {
    const token = localStorage.getItem('accessToken')
    const resp = await fetch('/api/admin/backup/download', {
      headers: { Authorization: 'Bearer ' + token },
    })
    if (!resp.ok) { result.value = '下载失败：' + resp.statusText; return }
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'lottery-backup.db'
    a.click()
    URL.revokeObjectURL(url)
    result.value = '下载成功'
  } catch { result.value = '下载失败' }
}

async function importDb(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!confirm('导入数据库将替换当前数据。建议先下载备份。确定继续？')) return
  importing.value = true
  result.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post('/admin/backup/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    result.value = data.success ? '导入成功！服务端将自动重启。' : '导入失败：' + (data.message || '未知错误')
  } catch (e: any) {
    result.value = '导入失败：' + (e.response?.data?.message || '请求错误')
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto">
    <h1 class="text-xl font-bold text-[var(--text-primary)] mb-6">数据备份</h1>

    <div class="card p-6 bg-[var(--bg-card)] space-y-6">
      <div>
        <h2 class="text-sm font-semibold text-[var(--text-primary)] mb-2">下载数据库</h2>
        <p class="text-xs text-[var(--text-muted)] mb-3">下载当前 SQLite 数据库文件（.db），用于备份或迁移。</p>
        <button class="btn-primary text-sm" @click="download">📥 下载备份</button>
      </div>

      <div class="border-t border-solid border-[var(--border-color)] pt-5">
        <h2 class="text-sm font-semibold text-[var(--text-primary)] mb-2">导入数据库</h2>
        <p class="text-xs text-[var(--text-muted)] mb-3">上传之前备份的 .db 文件以还原数据。⚠️ 当前数据库将被替换。</p>
        <label class="btn-secondary text-sm inline-flex cursor-pointer">
          {{ importing ? '导入中...' : '📤 选择文件并导入' }}
          <input type="file" accept=".db" class="hidden" @change="importDb" :disabled="importing" />
        </label>
      </div>

      <div v-if="result" class="p-3 rounded-xl text-sm font-medium" :class="result.includes('成功') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'">
        {{ result }}
      </div>
    </div>
  </div>
</template>