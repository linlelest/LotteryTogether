<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

const theme = useThemeStore()
const auth = useAuthStore()
const collapsed = ref(false)
const mobileOpen = ref(false)

const navItems = [
  { path: '/admin/users', icon: '👥', label: '用户管理' },
  { path: '/admin/invite-codes', icon: '🔑', label: '邀请码管理' },
  { path: '/admin/announcements', icon: '📢', label: '公告管理' },
  { path: '/admin/backup', icon: '💾', label: '数据备份' },
]
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Desktop sidebar -->
    <aside
      class="hidden lg:flex flex-col bg-[var(--bg-secondary)] border-r-1 border-solid border-[var(--border-color)] z-50 transition-all duration-200 shrink-0"
      :class="collapsed ? 'w-16' : 'w-56'"
    >
      <div class="flex items-center h-16 px-4 border-b-1 border-solid border-[var(--border-color)] shrink-0" :class="collapsed ? 'justify-center' : 'justify-between'">
        <span v-if="!collapsed" class="text-base font-bold text-[var(--accent)]">管理后台</span>
        <button class="text-[var(--text-muted)] hover:text-[var(--accent)] text-sm" @click="collapsed = !collapsed">
          {{ collapsed ? '▶' : '◀' }}
        </button>
      </div>

      <nav class="flex-1 px-2 py-3 space-y-1.5 overflow-y-auto">
        <a
          v-for="item in navItems"
          :key="item.path"
          :href="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--accent)] hover:text-white transition-all"
          :class="collapsed ? 'justify-center' : ''"
          :title="collapsed ? item.label : undefined"
        >
          <span class="text-base shrink-0">{{ item.icon }}</span>
          <span v-if="!collapsed">{{ item.label }}</span>
        </a>
      </nav>

      <div class="p-3 border-t-1 border-solid border-[var(--border-color)] space-y-1.5">
        <a href="/activities" class="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--accent)] hover:text-white transition-all" :class="collapsed ? 'justify-center' : ''" :title="collapsed ? '返回首页' : undefined">
          <span>🏠</span>
          <span v-if="!collapsed">返回首页</span>
        </a>
        <button
          class="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm hover:bg-[var(--accent)] hover:text-white w-full transition-all"
          :class="collapsed ? 'justify-center' : ''"
          @click="theme.toggle()"
          :title="collapsed ? '主题切换' : undefined"
        >
          <span>{{ theme.isDark ? '☀️' : '🌙' }}</span>
          <span v-if="!collapsed">{{ theme.isDark ? '浅色' : '深色' }}</span>
        </button>
      </div>
    </aside>

    <!-- Right content -->
    <div class="flex-1 min-w-0 flex flex-col">
      <!-- Tablet header -->
      <header class="md:flex lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--bg-secondary)] border-b-1 border-solid border-[var(--border-color)] z-50 flex items-center justify-between px-4">
        <button class="text-xl text-[var(--text-primary)]" @click="mobileOpen = true">☰</button>
        <span class="text-sm font-bold text-[var(--accent)]">管理后台</span>
        <button @click="theme.toggle()">{{ theme.isDark ? '☀️' : '🌙' }}</button>
      </header>

      <!-- Tablet overlay -->
      <div v-if="mobileOpen" class="fixed inset-0 z-50 bg-black/50" @click="mobileOpen = false">
        <div class="w-56 bg-[var(--bg-secondary)] h-full p-4 overflow-y-auto" @click.stop>
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm font-bold text-[var(--accent)]">管理后台</span>
            <button @click="mobileOpen = false">✕</button>
          </div>
          <nav class="space-y-1">
            <a v-for="item in navItems" :key="item.path" :href="item.path" class="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">
              <span>{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
            <a href="/activities" class="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-white transition-all" @click="mobileOpen = false">
              <span>🏠</span><span>返回首页</span>
            </a>
          </nav>
        </div>
      </div>

      <!-- Main -->
      <main class="flex-1 bg-[var(--bg-primary)] pt-14 lg:pt-0 pb-14 md:pb-0 overflow-y-auto overflow-x-hidden max-w-full p-4 md:p-6">
        <router-view />
      </main>

      <!-- Mobile bottom nav -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--bg-secondary)] border-t-1 border-solid border-[var(--border-color)] z-50 flex items-center justify-around px-1">
        <a href="/admin/users" class="flex flex-col items-center gap-0.5 text-xs text-[var(--accent)]">
          <span>👥</span><span>用户</span>
        </a>
        <a href="/admin/users" class="flex flex-col items-center gap-0.5 text-xs text-[var(--text-muted)]">
          <span>👥</span><span>用户</span>
        </a>
        <a href="/admin/invite-codes" class="flex flex-col items-center gap-0.5 text-xs text-[var(--text-muted)]">
          <span>🔑</span><span>邀请码</span>
        </a>
        <a href="/admin/backup" class="flex flex-col items-center gap-0.5 text-xs text-[var(--text-muted)]">
          <span>💾</span><span>备份</span>
        </a>
        <a href="/activities" class="flex flex-col items-center gap-0.5 text-xs text-[var(--text-muted)]">
          <span>🏠</span><span>首页</span>
        </a>
      </nav>
    </div>
  </div>
</template>