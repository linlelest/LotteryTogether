import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  shortcuts: {
    'btn': 'px-5 py-2.5 rounded-full cursor-pointer transition-all duration-200 font-medium text-sm inline-flex items-center justify-center gap-2 box-border',
    'btn-primary': 'btn text-[var(--btn-text)] bg-[var(--accent)] hover:opacity-85 shadow-sm',
    'btn-secondary': 'btn border-1 border-solid border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
    'card': 'rounded-2xl border-1px border-solid border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm',
    'input': 'w-full px-5 py-3 rounded-full border-1 border-solid border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors text-sm box-border',
  },
  theme: {
    colors: {
      accent: '#00D1B2',
    },
  },
})