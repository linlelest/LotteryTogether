import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const zh: Record<string, string> = {
  'home': '首页',
  'create': '创建活动',
  'manage': '活动管理',
  'history': '参与历史',
  'profile': '个人中心',
  'admin': '管理后台',
  'about': '关于',
  'logout': '退出登录',
  'login': '登录',
  'register': '注册',
  'join': '加入抽奖',
  'create.draw': '创建抽奖',
  'join.draw': '加入抽奖',
  'light': '浅色',
  'dark': '深色',
  'theme': '主题',
  'lang.zh': '中文',
  'lang.en': 'EN',
  'hero.subtitle': '转盘 · 盲盒 · 纸条 — 三种玩法，无限乐趣',
  'search.placeholder': '搜索活动名称...',
  'tab.active': '进行中',
  'tab.ended': '已结束',
  'no.active': '暂无进行中的活动',
  'no.ended': '暂无已结束的活动',
  'back.admin': '返回首页',
  'publish': '发布',
  'edit': '编辑',
  'draft': '草稿',
  'delete': '删除',
  'share': '分享该抽奖',
}

const en: Record<string, string> = {
  'home': 'Home',
  'create': 'Create Activity',
  'manage': 'Manage Activities',
  'history': 'History',
  'profile': 'Profile',
  'admin': 'Admin Panel',
  'about': 'About',
  'logout': 'Logout',
  'login': 'Log In',
  'register': 'Sign Up',
  'join': 'Join Draw',
  'create.draw': 'Create Draw',
  'join.draw': 'Join Draw',
  'light': 'Light',
  'dark': 'Dark',
  'theme': 'Theme',
  'lang.zh': '中文',
  'lang.en': 'EN',
  'hero.subtitle': 'Wheel · Blind Box · Paper Slip — Endless Fun',
  'search.placeholder': 'Search activities...',
  'tab.active': 'Active',
  'tab.ended': 'Ended',
  'no.active': 'No active activities',
  'no.ended': 'No ended activities',
  'back.admin': 'Back to Home',
  'publish': 'Publish',
  'edit': 'Edit',
  'draft': 'Draft',
  'delete': 'Delete',
  'share': 'Share',
}

export const useI18nStore = defineStore('i18n', () => {
  const locale = ref(localStorage.getItem('locale') || 'zh')

  const t = (key: string): string => {
    const map = locale.value === 'en' ? en : zh
    return map[key] || key
  }

  function setLocale(l: string) {
    locale.value = l
    localStorage.setItem('locale', l)
  }

  return { locale, t, setLocale }
})