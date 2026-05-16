import { createRouter, createWebHistory } from 'vue-router'
import api from '@/api'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Landing.vue'),
      meta: { layout: 'none' },
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/Setup.vue'),
      meta: { layout: 'none' },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/Auth.vue'),
      meta: { layout: 'none' },
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('@/views/Join.vue'),
      meta: { layout: 'none' },
    },
    {
      path: '/activities',
      name: 'activities',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/activities/manageact',
      name: 'manage-activities',
      component: () => import('@/views/ActivityManage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/activities/manageact/create',
      name: 'manage-activities-create',
      component: () => import('@/views/admin/ActivityCreate.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/activities/manageact/:id/edit',
      name: 'manage-activities-edit',
      component: () => import('@/views/admin/ActivityCreate.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/activity/:id',
      name: 'activity-detail',
      component: () => import('@/views/ActivityDetail.vue'),
    },
    {
      path: '/lottery/:id',
      name: 'lottery',
      component: () => import('@/views/Lottery.vue'),
    },
    {
      path: '/share/:id',
      name: 'share',
      component: () => import('@/views/Share.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/About.vue'),
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/History.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/s/:code',
      name: 'short-link',
      beforeEnter: async (to) => {
        try {
          const { data } = await api.get(`/short-links/${to.params.code}`)
          window.location.href = data.targetUrl
        } catch {
          window.location.href = '/'
        }
      },
      component: () => import('@/views/Landing.vue'),
      meta: { layout: 'none' },
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', redirect: { name: 'admin-users' } },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UserManage.vue') },
        { path: 'invite-codes', name: 'admin-invite-codes', component: () => import('@/views/admin/InviteCodes.vue') },
        { path: 'announcements', name: 'admin-announcements', component: () => import('@/views/admin/Announcements.vue') },
        { path: 'backup', name: 'admin-backup', component: () => import('@/views/admin/Backup.vue') },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue'),
      meta: { layout: 'none' },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  // Always try to hydrate auth if token exists
  const token = localStorage.getItem('accessToken')
  if (token) {
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    if (!auth.user) {
      try { await auth.fetchUser() } catch { /* token invalid */ }
    }
  }

  // Check if system needs setup
  if (!to.path.startsWith('/setup')) {
    try {
      const { data } = await api.get('/auth/needs-setup')
      if (data.needsSetup) {
        next('/setup')
        return
      }
    } catch { /* ignore */ }
  }

  // Redirect authenticated users from landing to activities
  if (to.path === '/') {
    if (token) {
      const { useAuthStore } = await import('@/stores/auth')
      const auth = useAuthStore()
      if (auth.isLoggedIn) {
        next('/activities')
        return
      }
    }
  }

  if (to.meta.requiresAuth) {
    if (!token) {
      next('/auth')
      return
    }
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    if (!auth.user) {
      try {
        await auth.fetchUser()
      } catch {
        next('/auth')
        return
      }
    }
    if (to.meta.requiresAdmin && !auth.user?.isAdmin) {
      next('/')
      return
    }
  }
  next()
})

export default router