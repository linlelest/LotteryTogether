<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '@/api'

const props = defineProps<{
  activity: any
  prizes: any[]
}>()

const emit = defineEmits<{ draw: [result: any] }>()

const grid = ref<{ id: number; opened: boolean; prize: any | null; flipping: boolean }[]>([])
const collection = ref<any[]>([])
const openedCount = ref(0)
const pityCount = ref(0)
const pityMax = 10

const gridSize = computed(() => {
  return props.activity.blindBoxGridSize || 9
})

const openableCount = computed(() => {
  return props.activity.blindBoxOpenable || 3
})

const cols = computed(() => {
  const s = gridSize.value
  if (s <= 4) return 2
  if (s <= 9) return 3
  if (s <= 12) return 3
  return 4
})

const allOpened = computed(() => {
  return openedCount.value >= openableCount.value
})

function initGrid() {
  const total = gridSize.value
  grid.value = Array.from({ length: total }, (_, i) => ({
    id: i,
    opened: false,
    prize: null,
    flipping: false,
  }))
  openedCount.value = 0
}

async function openBox(idx: number) {
  const box = grid.value[idx]
  if (box.opened || box.flipping || allOpened.value) return

  box.flipping = true
  try {
    const { data } = await api.post(`/draw/${props.activity.id}`)
    emit('draw', data)
    box.prize = data.prize
    openedCount.value++
    box.opened = true
    pityCount.value = data.prize?.type === 'empty' ? pityCount.value + 1 : 0

    if (data.prize && data.prize.type !== 'empty') {
      collection.value.push(data.prize)
    }
  } catch (e: any) { alert(e.response?.data?.message || '抽奖失败') }
  finally { box.flipping = false }
}

function reshuffle() {
  initGrid()
}

initGrid()
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-6">
    <div class="flex-1">
      <div class="grid gap-3 max-w-md mx-auto" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
        <div v-for="(box, idx) in grid" :key="box.id" class="aspect-square perspective-[800px]" @click="openBox(idx)">
          <div :data-box="idx"
            class="relative w-full h-full transition-transform duration-600 cursor-pointer"
            :class="allOpened && !box.opened ? 'opacity-50 cursor-not-allowed' : ''"
            :style="box.opened ? 'transform: rotateY(180deg)' : ''"
          >
            <!-- Front face (unopened) -->
            <div class="absolute inset-0 rounded-2xl bg-[var(--accent)] flex items-center justify-center backface-hidden hover:opacity-90" :class="allOpened && !box.opened ? 'pointer-events-none' : ''">
              <span class="text-2xl">🎁</span>
            </div>
            <!-- Back face (opened) -->
            <div class="absolute inset-0 rounded-2xl bg-[var(--bg-card)] border border-solid border-[var(--border-color)] flex flex-col items-center justify-center p-2 text-center backface-hidden" style="transform: rotateY(180deg)">
              <span class="text-2xl">{{ box.prize?.type === 'physical' ? '📦' : '🎫' }}</span>
              <p class="text-xs text-[var(--text-primary)] mt-1 leading-tight">{{ box.prize?.name || '未中奖' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center gap-4 mt-4">
        <button class="btn-secondary text-sm" @click="reshuffle" v-if="allOpened">换一批</button>
        <span class="text-xs text-[var(--text-muted)]">已开 {{ openedCount }} / {{ openableCount }} 个</span>
      </div>
    </div>

    <div class="w-full lg:w-72 space-y-4">
      <div class="card p-4 bg-[var(--bg-card)]">
        <h3 class="text-sm font-medium text-[var(--text-primary)] mb-2">🔔 掉落预告</h3>
        <div class="flex items-center gap-2 mb-2">
          <div class="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div class="h-full rounded-full transition-all" :class="pityCount >= pityMax - 1 ? 'bg-red-500' : 'bg-[var(--accent)]'" :style="{ width: ((pityCount % pityMax) / pityMax * 100) + '%' }"></div>
          </div>
          <span class="text-xs text-[var(--text-muted)] shrink-0">{{ pityCount % pityMax }}/{{ pityMax }}</span>
        </div>
        <p class="text-xs text-[var(--text-muted)]">{{ pityCount >= pityMax - 1 ? '🔥 下一发必出稀有奖品！' : '连续未中奖达到保底次数后将必定获得稀有奖品' }}</p>
      </div>

      <div class="card p-4 bg-[var(--bg-card)]">
        <h3 class="text-sm font-medium text-[var(--text-primary)] mb-2">🎴 收集图鉴</h3>
        <div v-if="collection.length === 0" class="text-xs text-[var(--text-muted)]">暂未收集到奖品</div>
        <div v-else class="grid grid-cols-4 gap-2">
          <div v-for="item in collection" :key="item.id" class="aspect-square rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-xl" :title="item.name">{{ item.type === 'physical' ? '📦' : '🎫' }}</div>
        </div>
        <p class="text-xs text-[var(--text-muted)] mt-2">已收集 {{ collection.length }} 种</p>
      </div>
    </div>
  </div>
</template>