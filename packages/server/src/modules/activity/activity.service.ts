import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { randomBytes } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Activity, ActivityMode, ActivityStatus } from './activity.entity'
import { Prize } from '../prize/prize.entity'

const VALID_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> = {
  draft: ['pending', 'active', 'ended'],
  pending: ['active', 'draft', 'ended'],
  active: ['paused', 'ended', 'draft'],
  paused: ['active', 'ended'],
  ended: [],
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
    @InjectRepository(Prize)
    private readonly prizeRepo: Repository<Prize>,
  ) {}

  async create(data: Partial<Activity>, createdById: number): Promise<Activity> {
    const lotteryCode = await this.generateUniqueCode()
    const entity = this.repo.create({ ...data, createdById, lotteryCode })
    return this.repo.save(entity)
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = ''
      const bytes = randomBytes(10)
      for (let i = 0; i < 10; i++) {
        code += chars[bytes[i] % chars.length]
      }
      const existing = await this.repo.findOne({ where: { lotteryCode: code } })
      if (!existing) return code
    }
    return Date.now().toString(36).toUpperCase()
  }

  async findAllPublic(params: {
    page?: number; pageSize?: number; mode?: ActivityMode; status?: ActivityStatus; search?: string
  }): Promise<{ items: Activity[]; total: number; page: number; pageSize: number }> {
    // Auto-end activities past their endTime
    if (!params.status || params.status === 'active') {
      await this.repo
        .createQueryBuilder()
        .update(Activity)
        .set({ status: 'ended' })
        .where('endTime IS NOT NULL AND endTime < :now AND status = :active', {
          now: new Date(),
          active: 'active',
        })
        .execute()
    }
    const page = params.page || 1
    const pageSize = Math.min(params.pageSize || 20, 100)
    const where: any = { isPublic: true, status: params.status || 'active' }
    if (params.status === 'ended') where.status = 'ended'
    if (params.mode) where.mode = params.mode
    if (params.search) where.name = Like(`%${params.search}%`)
    const [items, total] = await this.repo.findAndCount({
      where, order: { participantCount: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize, take: pageSize,
    })
    return { items, total, page, pageSize }
  }

  async findAll(params: {
    page?: number; pageSize?: number; mode?: string; status?: string; search?: string
  }): Promise<{ items: Activity[]; total: number; page: number; pageSize: number }> {
    const page = params.page || 1
    const pageSize = Math.min(params.pageSize || 20, 100)
    const where: any = {}
    if (params.mode) where.mode = params.mode
    if (params.status) where.status = params.status
    if (params.search) where.name = Like(`%${params.search}%`)
    const [items, total] = await this.repo.findAndCount({
      where, order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize, take: pageSize,
      relations: ['createdBy'],
    })
    return { items, total, page, pageSize }
  }

  async findById(id: number): Promise<Activity> {
    const activity = await this.repo.findOne({ where: { id }, relations: ['createdBy'] })
    if (!activity) throw new NotFoundException('Activity not found')
    return activity
  }

  async findByCode(code: string): Promise<Activity> {
    const activity = await this.repo.findOne({ where: { lotteryCode: code }, relations: ['createdBy'] })
    if (!activity) throw new NotFoundException('Activity not found')
    return activity
  }

  async verifyPassword(id: number, password: string): Promise<boolean> {
    const activity = await this.findById(id)
    if (!activity.accessPassword) return true
    return activity.accessPassword === password
  }

  async update(id: number, data: Partial<Activity>): Promise<Activity> {
    const activity = await this.findById(id)
    Object.assign(activity, data)
    return this.repo.save(activity)
  }

  async transition(id: number, newStatus: ActivityStatus): Promise<Activity> {
    const activity = await this.findById(id)
    const allowed = VALID_TRANSITIONS[activity.status]
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${activity.status} to ${newStatus}`,
      )
    }
    activity.status = newStatus
    if (newStatus === 'ended') await this.cleanupImages(id)
    return this.repo.save(activity)
  }

  async incrementParticipantCount(id: number): Promise<void> {
    await this.repo.increment({ id }, 'participantCount', 1)
  }

  async remove(id: number): Promise<void> {
    const activity = await this.findById(id)
    await this.repo.remove(activity)
  }

  private async cleanupImages(activityId: number) {
    const prizes = await this.prizeRepo.find({ where: { activityId } })
    const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads')
    for (const prize of prizes) {
      if (prize.image && prize.image.startsWith('/uploads/')) {
        const filePath = path.join(uploadsDir, path.basename(prize.image))
        try { fs.unlinkSync(filePath) } catch { /* ignore */ }
      }
    }
  }

  async forceEnd(id: number, reason: string, userId: number): Promise<Activity> {
    const activity = await this.findById(id)
    activity.status = 'ended'
    activity.forceEndReason = reason
    await this.cleanupImages(id)
    return this.repo.save(activity)
  }
}