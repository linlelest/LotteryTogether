<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const auth = useAuthStore()
const editing = ref(false)
const nickname = ref('')
const showPasswordForm = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pwError = ref('')
const pwSuccess = ref(false)

onMounted(() => {
  if (auth.user) nickname.value = auth.user.username || ''
})

async function saveProfile() {
  await auth.updateProfile({ username: nickname.value })
  editing.value = false
}

async function changePassword() {
  pwError.value = ''
  pwSuccess.value = false
  if (newPassword.value.length < 6) { pwError.value = '密码至少6位'; return }
  if (newPassword.value !== confirmPassword.value) { pwError.value = '两次密码不一致'; return }
  try {
    await api.patch('/users/me', { password: newPassword.value })
    pwSuccess.value = true
    showPasswordForm.value = false
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: any) {
    pwError.value = e.response?.data?.message || '修改失败'
  }
}

async function handleAvatar(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) await auth.uploadAvatar(input.files[0])
}

function logout() {
  auth.logout()
  window.location.href = '/'
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-6">
    <!-- Avatar card -->
    <div class="card p-6 bg-[var(--bg-card)] text-center">
      <div class="relative w-20 h-20 mx-auto mb-4">
        <img :src="auth.user?.avatar || '/default-avatar.svg'" alt="avatar" class="w-20 h-20 rounded-full object-cover border-2 border-solid border-[var(--accent)]" />
        <label class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center cursor-pointer text-xs hover:opacity-85 transition-all">✎<input type="file" accept="image/*" class="hidden" @change="handleAvatar" /></label>
      </div>
      <h2 class="text-lg font-medium text-[var(--text-primary)]">{{ auth.user?.username }}</h2>
      <p class="text-sm text-[var(--text-muted)] mt-1">邀请码余额: {{ auth.user?.inviteCodeCount || 0 }}</p>
    </div>

    <!-- Profile info -->
    <div class="card p-6 bg-[var(--bg-card)] mt-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-[var(--text-primary)]">个人信息</h3>
        <button class="btn-secondary text-xs px-4 py-1.5" @click="editing = !editing">{{ editing ? '取消' : '编辑' }}</button>
      </div>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-[var(--text-muted)]">用户名</label>
          <input v-if="editing" v-model="nickname" class="input mt-1" />
          <p v-else class="text-sm text-[var(--text-primary)] mt-1">{{ auth.user?.username }}</p>
        </div>
        <div>
          <label class="text-xs text-[var(--text-muted)]">邀请码余额</label>
          <p class="text-sm text-[var(--text-primary)] mt-1">{{ auth.user?.inviteCodeCount || 0 }}</p>
        </div>
        <div>
          <label class="text-xs text-[var(--text-muted)]">注册时间</label>
          <p class="text-sm text-[var(--text-primary)] mt-1">{{ auth.user?.createdAt ? new Date(auth.user.createdAt).toLocaleDateString('zh-CN') : '-' }}</p>
        </div>
        <button v-if="editing" class="btn-primary text-sm px-6 py-2" @click="saveProfile">保存修改</button>
      </div>
    </div>

    <!-- Password -->
    <div class="card p-6 bg-[var(--bg-card)] mt-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-[var(--text-primary)]">修改密码</h3>
        <button class="btn-secondary text-xs px-4 py-1.5" @click="showPasswordForm = !showPasswordForm">{{ showPasswordForm ? '取消' : '修改' }}</button>
      </div>
      <div v-if="showPasswordForm" class="space-y-3">
        <input v-model="newPassword" type="password" placeholder="新密码（至少6位）" class="input" />
        <input v-model="confirmPassword" type="password" placeholder="确认新密码" class="input" />
        <div v-if="pwError" class="text-xs text-red-500">{{ pwError }}</div>
        <div v-if="pwSuccess" class="text-xs text-green-500">密码修改成功</div>
        <button class="btn-primary text-sm px-6 py-2" @click="changePassword">确认修改</button>
      </div>
    </div>

    <!-- Logout -->
    <button class="btn-secondary w-full mt-4 py-2.5 text-sm" @click="logout">退出登录</button>
  </div>
</template>