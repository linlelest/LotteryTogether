<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { gsap } from 'gsap'

const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()

const lang = ref<'zh' | 'en'>('zh')

const t = {
  subtitle: { zh: '极简抽奖平台', en: 'Minimal Lottery Platform' },
  login: { zh: '登录', en: 'Log In' },
  register: { zh: '注册', en: 'Sign Up' },
  features: {
    zh: ['🔄 转盘', '📦 盲盒', '📝 纸条', '📊 看板'],
    en: ['🔄 Wheel', '📦 Blind Box', '📝 Paper Slip', '📊 Dashboard'],
  },
}

function go(path: string) {
  router.push(path)
}

onMounted(() => {
  gsap.from('.hero-title', { y: 40, opacity: 0, duration: 1, ease: 'power3.out' })
  gsap.from('.hero-sub', { y: 30, opacity: 0, duration: 1, delay: 0.3, ease: 'power3.out' })
  gsap.from('.hero-actions', { y: 20, opacity: 0, duration: 1, delay: 0.5, ease: 'power3.out' })
  gsap.from('.feature-item', { y: 30, opacity: 0, duration: 0.8, stagger: 0.15, delay: 0.8, ease: 'power3.out' })
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--bg-primary)]">
    <!-- Background decoration -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-20 left-10 w-64 h-64 rounded-full bg-[var(--accent)]/5 blur-3xl"></div>
      <div class="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[var(--accent)]/5 blur-3xl"></div>
    </div>

    <!-- Icon (top-left) -->
    <div class="absolute top-6 left-6 z-10">
      <img src="/2048icon.png" class="w-10 h-10 rounded-xl object-cover" />
    </div>

    <!-- Top bar -->
    <div class="absolute top-6 right-6 flex items-center gap-2 z-10">
      <button class="w-9 h-9 rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] hover:text-[var(--accent)] flex items-center justify-center shadow-sm border border-solid border-[var(--border-color)] transition-all" @click="theme.toggle()">
        {{ theme.isDark ? '☀️' : '🌙' }}
      </button>
    </div>

    <!-- Content -->
    <div class="relative z-10 text-center px-6 max-w-3xl">
      <div class="hero-title">
        <span class="text-5xl md:text-7xl font-bold tracking-tight">
          <span class="text-[var(--text-primary)]">Lottery</span>
          <span class="text-[var(--accent)]">Together</span>
        </span>
      </div>

      <p class="hero-sub mt-3 text-base md:text-lg text-[var(--text-secondary)] font-light">
        {{ lang === 'zh' ? t.subtitle.zh : t.subtitle.en }}
      </p>

      <div class="hero-actions mt-8 flex items-center justify-center gap-4">
        <button
          class="btn-primary px-8 py-3 text-base"
          @click="go('/activities/manageact/create')"
        >
          {{ lang === 'zh' ? '创建抽奖' : 'Create Draw' }}
        </button>
        <button
          class="btn-secondary px-8 py-3 text-base"
          @click="go('/join')"
        >
          {{ lang === 'zh' ? '加入抽奖' : 'Join Draw' }}
        </button>
      </div>

      <!-- Features -->
      <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="(item, i) in (lang === 'zh' ? t.features.zh : t.features.en)"
          :key="i"
          class="feature-item p-6 rounded-2xl bg-[var(--bg-card)] border-1 border-solid border-[var(--border-color)] shadow-sm text-center"
        >
          <span class="text-3xl block mb-1">{{ item.split(' ')[0] }}</span>
          <span class="text-base font-medium text-[var(--text-primary)]">{{ item.split(' ').slice(1).join(' ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>