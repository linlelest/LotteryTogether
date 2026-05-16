<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import AppLayout from '@/layouts/AppLayout.vue'
import AnnouncementModal from '@/components/AnnouncementModal.vue'

const theme = useThemeStore()
const route = useRoute()

const showAppLayout = computed(() => {
  const meta = route.meta as Record<string, any>
  const parentMeta = route.matched?.[0]?.meta as Record<string, any> | undefined
  const isAdmin = meta.requiresAdmin || parentMeta?.requiresAdmin
  return meta.layout !== 'none' && !isAdmin
})

onMounted(() => {
  theme.init()
})
</script>

<template>
  <AppLayout v-if="showAppLayout">
    <router-view />
  </AppLayout>
  <router-view v-else />
  <AnnouncementModal />
</template>