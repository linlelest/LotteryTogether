<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'
import api from '@/api'
import ActivityCard from '@/components/ActivityCard.vue'
import HomeSearch from '@/components/HomeSearch.vue'

const activeActivities = ref<any[]>([])
const endedActivities = ref<any[]>([])
const loading = ref(false)
const searchMode = ref(false)
const tab = ref<'active' | 'ended'>('active')

const showGuide = ref(false)
const guideStep = ref(1)

let observers: IntersectionObserver[] = []

function observeAnimate(el: Element) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        gsap.from(entry.target, { y: 40, opacity: 0, duration: 1.2, ease: 'power2.out', clearProps: 'all' })
        obs.unobserve(entry.target)
      }
    })
  }, { threshold: 0.05 })
  obs.observe(el)
  observers.push(obs)
}

function initScrollAnimations() {
  document.querySelectorAll('.animate-on-scroll:not(.observed)').forEach((el) => {
    el.classList.add('observed')
    observeAnimate(el)
  })
}

onMounted(() => {
  if (!localStorage.getItem('guideSeen')) showGuide.value = true

  gsap.from('.hero-title', { y: 40, opacity: 0, duration: 1, ease: 'power3.out' })
  gsap.from('.hero-sub', { y: 30, opacity: 0, duration: 1, delay: 0.3, ease: 'power3.out' })
  gsap.from('.hero-actions', { y: 20, opacity: 0, duration: 1, delay: 0.5, ease: 'power3.out' })
  gsap.from('.scroll-indicator', { y: 20, opacity: 0, duration: 1, delay: 0.8, ease: 'power3.out' })

  const mo = new MutationObserver(initScrollAnimations)
  mo.observe(document.body, { childList: true, subtree: true })
  initScrollAnimations()

  loadActive()
  loadEnded()
})

onUnmounted(() => {
  observers.forEach(o => o.disconnect())
})

function loadActive() {
  loading.value = true
  api.get('/activities/public', { params: { pageSize: 12, status: 'active' } })
    .then(({ data }) => { activeActivities.value = data.items || [] })
    .catch(() => {})
    .finally(() => { loading.value = false })
}

function loadEnded() {
  api.get('/activities/public', { params: { pageSize: 12, status: 'ended' } })
    .then(({ data }) => { endedActivities.value = data.items || [] })
    .catch(() => {})
}

function onSearch(keyword: string) {
  searchMode.value = !!keyword
  const status = tab.value === 'ended' ? 'ended' : 'active'
  loading.value = true
  api.get('/activities/public', { params: { pageSize: 12, status, search: keyword || undefined } })
    .then(({ data }) => {
      if (tab.value === 'ended') endedActivities.value = data.items || []
      else activeActivities.value = data.items || []
    })
    .catch(() => {})
    .finally(() => { loading.value = false })
}

function closeGuide() { showGuide.value = false; localStorage.setItem('guideSeen', 'true') }
function nextGuide() { if (guideStep.value < 2) guideStep.value++; else closeGuide() }
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-16 pb-24">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-20 left-10 w-64 h-64 rounded-full bg-[var(--accent)]/5 blur-3xl"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[var(--accent)]/5 blur-3xl"></div>
      </div>
      <div class="relative z-10 text-center max-w-2xl">
        <div class="hero-title">
          <span class="text-5xl md:text-7xl font-bold tracking-tight">
            <span class="text-[var(--text-primary)]">Lottery</span>
            <span class="text-[var(--accent)]">Together</span>
          </span>
        </div>
        <p class="hero-sub mt-4 text-lg text-[var(--text-secondary)] font-light">转盘 · 盲盒 · 纸条 — 三种玩法，无限乐趣</p>
        <div class="hero-actions mt-8 flex items-center justify-center gap-4">
          <a href="/activities/manageact/create" class="btn-primary px-8 py-3 text-base">创建抽奖</a>
          <a href="/join" class="btn-secondary px-8 py-3 text-base">加入抽奖</a>
        </div>
        <div class="scroll-indicator mt-12 flex flex-col items-center gap-2 animate-bounce">
          <span class="text-xs text-[var(--text-muted)]">下滑探索发现</span>
          <span class="text-lg text-[var(--accent)]">↓</span>
        </div>
      </div>
    </section>

    <!-- Search -->
    <section class="animate-on-scroll max-w-6xl mx-auto px-4 mb-6">
      <HomeSearch @search="onSearch" />
    </section>

    <!-- Tabs -->
    <section class="animate-on-scroll max-w-6xl mx-auto px-4 mb-4">
      <div class="flex gap-2">
        <button class="px-4 py-2 rounded-full text-sm transition-all" :class="tab === 'active' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'" @click="tab = 'active'">进行中</button>
        <button class="px-4 py-2 rounded-full text-sm transition-all" :class="tab === 'ended' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'" @click="tab = 'ended'">已结束</button>
      </div>
    </section>

    <!-- Activities -->
    <section class="animate-on-scroll max-w-6xl mx-auto px-4">
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="card bg-[var(--bg-card)] p-4 animate-pulse"><div class="aspect-[16/9] bg-[var(--bg-secondary)] rounded-8px"></div><div class="mt-3 h-4 bg-[var(--bg-secondary)] rounded-4px w-3/4"></div><div class="mt-2 h-3 bg-[var(--bg-secondary)] rounded-4px w-1/2"></div></div>
      </div>
      <div v-else-if="tab === 'active' && activeActivities.length === 0" class="text-center py-16 text-sm text-[var(--text-muted)]">暂无进行中的活动</div>
      <div v-else-if="tab === 'ended' && endedActivities.length === 0" class="text-center py-16 text-sm text-[var(--text-muted)]">暂无已结束的活动</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ActivityCard v-for="a in (tab === 'active' ? activeActivities : endedActivities)" :key="a.id" :activity="a" />
      </div>
    </section>

    <!-- Newbie Guide -->
    <Teleport to="body">
      <div v-if="showGuide" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" @click.self="closeGuide">
        <div class="w-full max-w-sm mx-4 bg-[var(--bg-card)] rounded-2xl shadow-md p-6 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <span class="text-2xl">{{ guideStep === 1 ? '👋' : '💡' }}</span>
          </div>
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ ['欢迎来到 LotteryTogether', '使用侧边栏'][guideStep - 1] }}</h3>
          <p class="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
            {{ guideStep === 1 ? '点击屏幕左侧边缘的 ▶ 按钮，即可展开侧边栏菜单，开始你的抽奖之旅。' : '在侧边栏中你可以创建活动、管理抽奖、查看历史记录等。现在就试试吧！' }}
          </p>
          <div class="flex items-center justify-center gap-2 mt-6">
            <span v-for="s in 2" :key="s" class="w-2 h-2 rounded-full transition-all" :class="s === guideStep ? 'bg-[var(--accent)] w-4' : 'bg-[var(--border-color)]'"></span>
          </div>
          <div class="flex items-center justify-between mt-6">
            <button class="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]" @click="closeGuide">跳过</button>
            <button class="btn-primary px-6 py-2 text-sm" @click="nextGuide">{{ guideStep < 2 ? '下一步' : '开始使用' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>