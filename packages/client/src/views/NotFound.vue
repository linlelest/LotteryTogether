<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
    <span class="text-6xl mb-4">🔗</span>
    <h1 class="text-xl font-bold text-[var(--text-primary)]">链接无效</h1>
    <p class="text-sm text-[var(--text-secondary)] mt-2">该活动已下架或链接无效</p>
    <button class="btn-primary mt-6 px-8 py-2.5" @click="router.push('/')">返回首页</button>
  </div>
</template>