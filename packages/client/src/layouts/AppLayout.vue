<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

const theme = useThemeStore()
const auth = useAuthStore()
const open = ref(true)
const mobileOpen = ref(false)

const avatarLetter = computed(() => {
  if (auth.user && auth.user.username) {
    return auth.user.username.charAt(0).toUpperCase()
  }
  return '?'
})

function doLogout() {
  auth.logout()
  window.location.href = '/'
}
</script>

<template>
  <div class="flex min-h-screen w-full">
    <button
      v-if="!open"
      class="hidden lg:flex fixed left-4 top-4 z-50 w-9 h-9 items-center justify-center rounded-full bg-[var(--bg-primary)] border border-solid border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all shadow-sm"
      @click="open = true"
    >▶</button>

    <!-- Desktop theme toggle (top-right, when sidebar closed) -->
    <button
      v-if="!open"
      class="hidden lg:flex fixed right-4 top-4 z-50 w-9 h-9 items-center justify-center rounded-full bg-[var(--bg-primary)] border border-solid border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all shadow-sm"
      @click="theme.toggle()"
    >{{ theme.isDark ? '☀️' : '🌙' }}</button>

    <aside
      class="hidden lg:flex flex-col bg-[var(--bg-secondary)] border-r border-solid border-[var(--border-color)] z-40 transition-all duration-200 shrink-0 h-screen sticky top-0"
      :class="open ? 'w-56' : 'w-0 overflow-hidden border-0'"
    >
      <div class="flex items-center gap-3 h-16 px-5 border-b border-solid border-[var(--border-color)] shrink-0">
        <span v-if="!auth.isLoggedIn" class="text-base font-bold text-[var(--accent)]">LT</span>
        <img v-if="auth.isLoggedIn && auth.user && auth.user.avatar" :src="auth.user.avatar" class="w-8 h-8 rounded-full object-cover border border-solid border-[var(--border-color)] shrink-0" />
        <span v-if="auth.isLoggedIn && auth.user && !auth.user.avatar" class="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-bold text-white shrink-0">{{ avatarLetter }}</span>
        <div v-if="auth.isLoggedIn && auth.user" class="flex-1 min-w-0">
          <p class="text-sm font-medium text-[var(--text-primary)] truncate">{{ auth.user.username }}</p>
        </div>
        <button class="text-[var(--text-muted)] hover:text-[var(--accent)] text-sm shrink-0 ml-auto" @click="open = false">◀</button>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <a href="/activities" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all">🏠 {{ '首页' }}</a>
        <a v-if="auth.isLoggedIn" href="/activities/manageact/create" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all">✨ {{ '创建活动' }}</a>
        <a v-if="auth.isLoggedIn" href="/activities/manageact" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all">📋 {{ '活动管理' }}</a>
        <a v-if="auth.isLoggedIn" href="/history" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all">📜 {{ '参与历史' }}</a>
        <a v-if="auth.isLoggedIn" href="/profile" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all">👤 {{ '个人中心' }}</a>
        <a v-if="auth.user && auth.user.isAdmin" href="/admin" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all">⚙️ {{ '管理后台' }}</a>
        <a href="/about" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all">ℹ️ {{ '关于' }}</a>
        <a v-if="!auth.isLoggedIn" href="/auth" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all">🔑 {{ '登录' }}</a>
        <a v-if="!auth.isLoggedIn" href="/join" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all">🎯 {{ '加入抽奖' }}</a>
      </nav>

      <div class="p-3 border-t border-solid border-[var(--border-color)] space-y-1">
        <button v-if="auth.isLoggedIn" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 w-full transition-all shadow-sm" @click="doLogout">
          <span>🚪</span>
          <span>退出登录</span>
        </button>
        <button class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--accent)] hover:text-white w-full transition-all shadow-sm" @click="theme.toggle()">
          <span>{{ theme.isDark ? '☀️' : '🌙' }}</span>
          <span>{{ theme.isDark ? '深色' : '浅色' }}</span>
        </button>
      </div>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col">
      <header class="md:flex lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--bg-secondary)] border-b border-solid border-[var(--border-color)] z-40 flex items-center justify-between px-4">
        <button class="w-9 h-9 rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] hover:text-[var(--accent)] flex items-center justify-center shadow-sm border border-solid border-[var(--border-color)]" @click="mobileOpen = true">☰</button>
        <span class="text-sm font-bold text-[var(--accent)]">LT</span>
        <button class="w-9 h-9 rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] hover:text-[var(--accent)] flex items-center justify-center shadow-sm border border-solid border-[var(--border-color)]" @click="theme.toggle()">{{ theme.isDark ? '☀️' : '🌙' }}</button>
      </header>

      <div v-if="mobileOpen" class="fixed inset-0 z-50 bg-black/50" @click="mobileOpen = false">
        <div class="w-56 bg-[var(--bg-secondary)] h-full p-4 flex flex-col" @click.stop>
          <div class="flex items-center justify-between mb-4 shrink-0">
            <span class="text-sm font-bold text-[var(--accent)]">菜单</span>
            <button class="text-lg text-[var(--text-muted)]" @click="mobileOpen = false">✕</button>
          </div>
          <nav class="flex-1 space-y-1 overflow-y-auto">
            <a href="/activities" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">🏠 首页</a>
            <a v-if="auth.isLoggedIn" href="/activities/manageact/create" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">✨ 创建活动</a>
            <a v-if="auth.isLoggedIn" href="/activities/manageact" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">📋 活动管理</a>
            <a v-if="auth.isLoggedIn" href="/history" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">📜 参与历史</a>
            <a v-if="auth.isLoggedIn" href="/profile" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">👤 个人中心</a>
            <a v-if="auth.user && auth.user.isAdmin" href="/admin" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">⚙️ 管理后台</a>
            <a href="/about" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">ℹ️ 关于</a>
            <a v-if="!auth.isLoggedIn" href="/auth" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">🔑 登录</a>
            <a v-if="!auth.isLoggedIn" href="/join" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">🎯 加入抽奖</a>
          </nav>
          <div class="pt-3 border-t border-solid border-[var(--border-color)] space-y-1 shrink-0">
            <button v-if="auth.isLoggedIn" class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 w-full transition-all shadow-sm" @click="doLogout; mobileOpen = false">
              <span>🚪</span><span>退出登录</span>
            </button>
            <button class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--accent)] hover:text-white w-full transition-all shadow-sm" @click="theme.toggle()">
              <span>{{ theme.isDark ? '☀️' : '🌙' }}</span>
              <span>{{ theme.isDark ? '深色' : '浅色' }}</span>
            </button>
          </div>
        </div>
      </div>

      <nav class="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--bg-secondary)] border-t border-solid border-[var(--border-color)] z-40 flex items-center justify-around px-2">
        <a href="/activities" class="flex flex-col items-center gap-0.5 text-xs" :class="auth.isLoggedIn ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'">
          <span class="text-lg">🏠</span><span>首页</span>
        </a>
        <a v-if="auth.isLoggedIn" href="/profile" class="flex flex-col items-center gap-0.5 text-xs text-[var(--text-muted)]">
          <span class="text-lg">👤</span><span>我的</span>
        </a>
        <a v-else href="/auth" class="flex flex-col items-center gap-0.5 text-xs text-[var(--text-muted)]">
          <span class="text-lg">🔑</span><span>登录</span>
        </a>
        <a v-if="auth.user && auth.user.isAdmin" href="/admin" class="flex flex-col items-center gap-0.5 text-xs text-[var(--text-muted)]">
          <span class="text-lg">⚙️</span><span>管理</span>
        </a>
        <a href="/join" class="flex flex-col items-center gap-0.5 text-xs text-[var(--text-muted)]">
          <span class="text-lg">🎯</span><span>加入</span>
        </a>
      </nav>

      <main class="flex-1 bg-[var(--bg-primary)] pt-14 lg:pt-0 pb-14 md:pb-0 overflow-x-hidden max-w-full">
        <slot />
      </main>
    </div>
  </div>
</template>