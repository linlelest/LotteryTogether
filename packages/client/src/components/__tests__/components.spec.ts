import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '@/components/AppFooter.vue'

describe('AppFooter', () => {
  it('renders copyright text', () => {
    const wrapper = mount(AppFooter)
    expect(wrapper.text()).toContain('LotteryTogether')
  })

  it('renders links', () => {
    const wrapper = mount(AppFooter)
    const links = wrapper.findAll('a')
    expect(links.length).toBeGreaterThanOrEqual(3)
  })
})

describe('ActivityCard', () => {
  it('renders activity name', async () => {
    const ActivityCard = (await import('@/components/ActivityCard.vue')).default
    const wrapper = mount(ActivityCard, {
      props: {
        activity: {
          id: 1,
          name: 'Test Activity',
          mode: 'wheel',
          status: 'active',
        },
      },
    })
    expect(wrapper.text()).toContain('Test Activity')
  })
})