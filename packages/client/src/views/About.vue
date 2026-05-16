<script setup lang="ts">
const year = 2026
const repo = 'https://github.com/linlelest/LotteryTogether'
const license = 'MIT'
const developer = 'Linlelest'
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-12 text-center">
    <img src="/2048icon.png" class="w-24 h-24 mx-auto mb-6 rounded-2xl object-cover" />
    <h1 class="text-xl font-bold text-[var(--text-primary)]">LotteryTogether</h1>
    <p class="text-sm text-[var(--text-secondary)] mt-2">在线抽奖活动平台</p>

    <div class="mt-8 space-y-3 text-sm text-[var(--text-secondary)]">
      <div class="flex justify-between">
        <span class="text-[var(--text-muted)]">版本</span>
        <span class="text-[var(--text-primary)]">1.0.0</span>
      </div>
      <div class="flex justify-between">
        <span class="text-[var(--text-muted)]">开发者</span>
        <span class="text-[var(--text-primary)]">{{ developer }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-[var(--text-muted)]">开源协议</span>
        <span class="text-[var(--text-primary)]">{{ license }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-[var(--text-muted)]">版权所有</span>
        <span class="text-[var(--text-primary)]">© {{ year }} {{ developer }}</span>
      </div>
      <div class="pt-2">
        <span class="text-[var(--text-muted)]">开源地址</span>
        <a :href="repo" target="_blank" rel="noopener noreferrer" class="block mt-1 text-[var(--accent)] hover:underline break-all">{{ repo }}</a>
      </div>
    </div>
  </div>
</template>