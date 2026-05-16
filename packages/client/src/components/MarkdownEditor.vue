<script setup lang="ts">
import { ref, computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const text = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
})

const preview = ref(false)
let textareaRef: HTMLTextAreaElement | null = null

function setRef(el: unknown) {
  textareaRef = el as HTMLTextAreaElement | null
}

function insert(before: string, after = '') {
  const el = textareaRef
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = text.value.substring(start, end)
  text.value = text.value.substring(0, start) + before + selected + after + text.value.substring(end)
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start + before.length, start + before.length + selected.length)
  })
}

const html = computed(() => {
  try { return marked(text.value) }
  catch { return text.value }
})
</script>

<template>
  <div class="border-1 border-solid border-[var(--border-color)] rounded-12px overflow-hidden">
    <!-- Toolbar -->
    <div class="flex flex-wrap gap-1 p-2 bg-[var(--bg-secondary)] border-b-1 border-solid border-[var(--border-color)]">
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" title="加粗" @click="insert('**', '**')">B</button>
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" title="斜体" @click="insert('*', '*')"><i>I</i></button>
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" @click="insert('## ')">H2</button>
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" @click="insert('### ')">H3</button>
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" @click="insert('- ')">• 列表</button>
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" @click="insert('1. ')">1. 编号</button>
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" @click="insert('[', '](url)')">🔗 链接</button>
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" @click="insert('![]', '(image.jpg)')">🖼️ 图片</button>
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" @click="insert('> ')">❝ 引用</button>
      <button class="px-2 py-1 text-xs rounded-4px hover:bg-[var(--accent)] hover:text-white transition-colors" @click="insert('```\n', '\n```')">⌨ 代码</button>
      <button
        class="ml-auto px-2 py-1 text-xs rounded-4px"
        :class="preview ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--accent)] hover:text-white'"
        @click="preview = !preview"
      >
        {{ preview ? '编辑' : '预览' }}
      </button>
    </div>

    <!-- Editor / Preview -->
    <div class="min-h-40">
      <textarea
        v-if="!preview"
        :ref="setRef"
        v-model="text"
        class="w-full min-h-40 p-3 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none resize-y"
        placeholder="输入 Markdown 内容..."
      />
      <div
        v-else
        class="w-full min-h-40 p-3 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] prose prose-sm max-w-none"
        v-html="html"
      />
    </div>
  </div>
</template>

<style scoped>
.prose :deep(h2) { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
.prose :deep(h3) { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
.prose :deep(ul), .prose :deep(ol) { padding-left: 1.5rem; margin: 0.25rem 0; }
.prose :deep(li) { margin: 0.125rem 0; }
.prose :deep(code) { background: var(--bg-secondary); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875rem; }
.prose :deep(pre) { background: var(--bg-secondary); padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0; }
.prose :deep(blockquote) { border-left: 3px solid var(--accent); padding-left: 1rem; margin: 0.5rem 0; color: var(--text-secondary); }
.prose :deep(a) { color: var(--accent); text-decoration: underline; }
.prose :deep(img) { max-width: 100%; border-radius: 8px; margin: 0.5rem 0; }
</style>