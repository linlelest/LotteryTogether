export interface User {
  id: number
  username: string
  isAdmin: boolean
  avatar?: string
  inviteCodeCount: number
  createdAt: string
  updatedAt: string
}

export type ActivityMode = 'wheel' | 'blindbox' | 'paper'

export type ActivityStatus = 'draft' | 'pending' | 'active' | 'paused' | 'ended'

export interface Activity {
  id: number
  name: string
  description?: string
  cover?: string
  mode: ActivityMode
  status: ActivityStatus
  startTime?: string
  endTime?: string
  createdById: number
  createdAt: string
  updatedAt: string
}

export type PrizeType = 'virtual'

export interface Prize {
  id: number
  name: string
  type: PrizeType
  stock: number
  weight: number
  image?: string
  activityId: number
  createdAt: string
  updatedAt: string
}

export type DrawStatus = 'pending' | 'shipped' | 'claimed'

export interface DrawRecord {
  id: number
  userId: number
  activityId: number
  prizeId?: number
  prizeName?: string
  status: DrawStatus
  drawnAt: string
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}