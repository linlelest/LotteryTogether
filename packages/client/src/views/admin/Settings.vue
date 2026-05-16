<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const inviteEnabled = ref(true)
const inviteHint = ref('')
const loading = ref(false)
const saved = ref(false)

onMounted(async () => {
  try {
    const { data: info } = await api.get('/auth/invite-info')
    inviteEnabled.value = info.enabled
    // Fetch full settings for the hint text
    const { data: settings } = await api.get('/admin/settings')
    for (const s of settings) {
      if (s.key === 'inviteHint') inviteHint.value = s.value
      if (s.key === 'inviteEnabled') inviteEnabled.value = s.value !== 'false'
    }
  } catch { /* not admin */ }
})

async function save() {
  loading.value = true
  try {
    await api.patch('/admin/settings', {
      inviteEnabled: inviteEnabled.value ? 'true' : 'false',
      inviteHint: inviteHint.value,
    })
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  } catch (e: any) {
    alert(e.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <h1 class="text-xl font-bold text-[var(--text-primary)] mb-6">系统设置</h1>

    <div class="card p-6 bg-[var(--bg-card)] space-y-6">
      <!-- Invite toggle -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-[var(--text-primary)]">邀请码系统</p>
          <p class="text-xs text-[var(--text-muted)]">关闭后新用户注册无需邀请码</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input v-model="inviteEnabled" type="checkbox" class="sr-only peer">
          <div class="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-[var(--accent)] transition-colors peer-focus:ring-2 peer-focus:ring-[var(--accent)]" />
          <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      <!-- Hint editor -->
      <div>
        <p class="text-sm font-medium text-[var(--text-primary)] mb-1">邀请码获取提示</p>
        <p class="text-xs text-[var(--text-muted)] mb-3">显示在注册页面，当用户输入错误或未输入邀请码时弹出</p>
        <MarkdownEditor v-model="inviteHint" />
      </div>

      <button class="btn-primary" :disabled="loading" @click="save">
        {{ loading ? '保存中...' : '保存设置' }}
      </button>
      <span v-if="saved" class="ml-3 text-sm text-[var(--accent)]">已保存</span>
    </div>
  </div>
</template>