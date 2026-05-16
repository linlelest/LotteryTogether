<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { gsap } from 'gsap'
import api from '@/api'

const props = defineProps<{
  activity: any
  prizes: any[]
}>()

const router = useRouter()
const emit = defineEmits<{ draw: [result: any] }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const spinning = ref(false)
const cooldown = ref(false)
const cooldownSec = ref(3)
const result = ref<any>(null)
const showProbModal = ref(false)
const logs = ref<any[]>([])
const drawError = ref('')

const totalWeight = computed(() => visiblePrizes.value.reduce((s: number, p: any) => s + p.weight, 0))
const visiblePrizes = computed(() => (props.prizes || []).filter((p: any) => p.stock > 0))

function drawWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const prizes = visiblePrizes.value
  if (!prizes.length) return
  const arc = (2 * Math.PI) / prizes.length
  prizes.forEach((p, i) => {
    const startAngle = i * arc - Math.PI / 2
    const endAngle = startAngle + arc
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = i % 2 === 0 ? '#00D1B2' : '#00B89D'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    const mid = startAngle + arc / 2
    ctx.save()
    ctx.translate(cx + Math.cos(mid) * r * 0.65, cy + Math.sin(mid) * r * 0.65)
    ctx.rotate(mid + Math.PI / 2)
    ctx.fillStyle = '#fff'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(p.name.length > 6 ? p.name.substring(0, 6) + '…' : p.name, 0, 4)
    ctx.restore()
  })
}

function renderWheel(rotation = 0) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const size = 400
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.rotate(rotation)
  ctx.translate(-size / 2, -size / 2)
  drawWheel(ctx, size / 2, size / 2, size / 2 - 10)
  ctx.restore()
  // Center circle
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 25, 0, 2 * Math.PI)
  ctx.fillStyle = '#111'
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('GO', size / 2, size / 2)
}

async function spin() {
  if (spinning.value || cooldown.value) return
  spinning.value = true
  try {
    const { data } = await api.post(`/draw/${props.activity.id}`)
    result.value = data

    // Rotate to random target
    const extraSpins = 5 + Math.floor(Math.random() * 3)
    const targetAngle = extraSpins * 2 * Math.PI + Math.random() * 2 * Math.PI

    gsap.to({ rot: 0 }, {
      rot: targetAngle,
      duration: 3,
      ease: 'power4.out',
      onUpdate: function () {
        renderWheel(this.targets()[0].rot)
      },
      onComplete: () => {
        spinning.value = false
        emit('draw', data)
        logs.value.unshift(data.record)
        startCooldown()
      },
    })
    } catch (e: any) {
      drawError.value = e.response?.data?.message || '抽奖失败'
      setTimeout(() => { drawError.value = '' }, 3000)
    } finally {
      spinning.value = false
    }
  }

function startCooldown() {
  cooldown.value = true
  cooldownSec.value = 3
  const timer = setInterval(() => {
    cooldownSec.value--
    if (cooldownSec.value <= 0) {
      clearInterval(timer)
      cooldown.value = false
    }
  }, 1000)
}

onMounted(() => renderWheel())
watch(() => props.prizes, () => renderWheel(), { deep: true })
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- Wheel -->
    <div class="flex-1 flex flex-col items-center">
      <div class="relative">
        <!-- Pointer -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-500"></div>
        <canvas ref="canvasRef" class="rounded-full"></canvas>
      </div>

      <button
        class="btn-primary mt-6 px-10 py-3 text-base"
        :disabled="spinning || cooldown"
        @click="spin"
      >
        {{ spinning ? '抽奖中...' : cooldown ? `冷却中 ${cooldownSec}s` : '抽奖' }}
      </button>

      <!-- Result -->
      <div v-if="result" class="mt-4 text-center">
        <p class="text-sm text-[var(--text-muted)]">恭喜获得</p>
        <p class="text-lg font-bold text-[var(--accent)]">{{ result.prize?.name || '未中奖' }}</p>
      </div>
      <p v-if="drawError" class="mt-2 text-sm text-red-500">{{ drawError }}</p>
    </div>

    <!-- Right panel -->
    <div class="w-full lg:w-72 space-y-4">
      <!-- Rules -->
      <div class="card p-4 bg-[var(--bg-card)]">
        <h3 class="text-sm font-medium text-[var(--text-primary)] mb-2">规则摘要</h3>
        <p class="text-xs text-[var(--text-muted)]">点击「抽奖」按钮旋转转盘，指针指向的奖品即为中奖结果。</p>
        <button class="text-xs text-[var(--accent)] hover:underline mt-2" @click="showProbModal = true">
          查看概率公示
        </button>
      </div>

      <!-- Share button -->
      <div class="card p-4 bg-[var(--bg-card)]">
        <button class="btn-primary w-full text-sm" @click="router.push('/share/' + props.activity.id)">分享该抽奖</button>
      </div>

      <!-- Logs -->
      <div class="card p-4 bg-[var(--bg-card)]">
        <h3 class="text-sm font-medium text-[var(--text-primary)] mb-2">开奖日志</h3>
        <div v-if="logs.length === 0" class="text-xs text-[var(--text-muted)]">暂无记录</div>
        <div v-else class="space-y-2 max-h-48 overflow-y-auto">
          <div v-for="log in logs" :key="log.id" class="text-xs border-b-1 border-solid border-[var(--border-color)] pb-1 last:border-0">
            <span class="text-[var(--text-primary)]">{{ log.prizeName || '未中奖' }}</span>
            <span class="text-[var(--text-muted)] ml-2">{{ new Date(log.drawnAt).toLocaleTimeString('zh-CN') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Probability modal -->
    <Teleport to="body">
      <div v-if="showProbModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" @click.self="showProbModal = false">
        <div class="w-full max-w-md mx-4 bg-[var(--bg-card)] rounded-12px shadow-md overflow-hidden">
          <div class="px-6 py-4 border-b-1 border-solid border-[var(--border-color)] flex items-center justify-between">
            <h3 class="text-base font-semibold text-[var(--text-primary)]">概率公示</h3>
            <button @click="showProbModal = false">✕</button>
          </div>
          <div class="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
            <div v-for="p in visiblePrizes" :key="p.id" class="flex items-center justify-between text-sm">
              <span class="text-[var(--text-primary)]">{{ p.name }}</span>
              <span class="text-[var(--text-muted)]">{{ totalWeight > 0 ? ((p.weight / totalWeight) * 100).toFixed(1) : 0 }}%</span>
            </div>
            <p class="text-xs text-[var(--text-muted)] mt-3 pt-3 border-t-1 border-solid border-[var(--border-color)]">
              权重总和: {{ totalWeight }} | 保底机制将在概率规则页中配置
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>