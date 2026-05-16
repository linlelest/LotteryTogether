import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

interface User {
  id: number
  username: string
  isAdmin: boolean
  avatar?: string
  inviteCodeCount: number
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref(localStorage.getItem('accessToken') || '')

  const isLoggedIn = computed(() => !!token.value)

  async function login(username: string, password: string) {
    const { data } = await api.post('/auth/login', { username, password })
    token.value = data.accessToken
    localStorage.setItem('accessToken', data.accessToken)
    await fetchUser()
  }

  async function register(username: string, password: string, inviteCode?: string) {
    const { data } = await api.post('/auth/register', { username, password, inviteCode })
    token.value = data.accessToken
    localStorage.setItem('accessToken', data.accessToken)
    await fetchUser()
  }

  async function fetchUser() {
    try {
      const { data } = await api.get('/users/me')
      user.value = data
    } catch {
      logout()
    }
  }

  async function updateProfile(dto: { username?: string }) {
    const { data } = await api.patch('/users/me', dto)
    user.value = data
  }

  async function uploadAvatar(file: File) {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    user.value = data
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return { user, token, isLoggedIn, login, register, fetchUser, updateProfile, uploadAvatar, logout }
})