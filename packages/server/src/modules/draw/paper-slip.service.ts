import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PaperSlip } from './paper-slip.entity'
import { DrawRecord } from './draw-record.entity'
import { Activity } from '../activity/activity.entity'
import { WsGateway } from '../ws/ws.gateway'

@Injectable()
export class PaperSlipService {
  constructor(
    @InjectRepository(PaperSlip)
    private readonly slipRepo: Repository<PaperSlip>,
    @InjectRepository(DrawRecord)
    private readonly drawRepo: Repository<DrawRecord>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    private readonly wsGateway: WsGateway,
  ) {}

  async submit(activityId: number, userId: number, content: string): Promise<{ slip: PaperSlip; autoDraw?: any }> {
    if (content.length > 200) throw new BadRequestException('Content exceeds 200 characters')
    const slip = this.slipRepo.create({ activityId, userId, content, status: 'approved' })
    const saved = await this.slipRepo.save(slip)
    const count = await this.slipRepo.count({ where: { activityId } })
    this.wsGateway.emitPaperSlipNotification(activityId, { count, lastContent: content.substring(0, 20) })

    // Auto-draw check for count-based trigger
    const activity = await this.activityRepo.findOne({ where: { id: activityId } })
    if (activity && activity.paperDrawTrigger === 'count' && count >= activity.paperDrawCount) {
      const result = await this.drawFromBox(activityId, 'random')
      if (result) {
        this.wsGateway.emitDrawResult(activityId, {
          userId: result.slip.userId,
          prizeName: result.record.prizeName || '',
          drawnAt: result.record.drawnAt.toISOString(),
        })
        return { slip: saved, autoDraw: result }
      }
    }

    return { slip: saved }
  }

  async getDrawStatus(activityId: number): Promise<{
    totalSlips: number
    triggerType: string
    targetCount: number
    drawTime: string | null
    canDraw: boolean
  }> {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } })
    if (!activity) throw new NotFoundException('Activity not found')
    const totalSlips = await this.slipRepo.count({ where: { activityId, status: 'approved' } })

    let canDraw = false
    if (activity.paperDrawTrigger === 'time' && activity.paperDrawTime) {
      canDraw = new Date(activity.paperDrawTime) <= new Date()
      if (canDraw) {
        // Auto-draw when time is reached
        try { await this.drawFromBox(activityId, 'random') } catch { /* ignore */ }
      }
    }
    if (activity.paperDrawTrigger === 'count') {
      canDraw = totalSlips >= activity.paperDrawCount
    }
    if (activity.paperDrawTrigger === 'manual') {
      canDraw = totalSlips > 0
    }

    return {
      totalSlips,
      triggerType: activity.paperDrawTrigger,
      targetCount: activity.paperDrawCount,
      drawTime: activity.paperDrawTime?.toISOString() || null,
      canDraw,
    }
  }

  async findByActivity(activityId: number, status?: string): Promise<PaperSlip[]> {
    const where: any = { activityId }
    if (status) where.status = status
    return this.slipRepo.find({ where, order: { createdAt: 'ASC' } })
  }

  async remove(id: number): Promise<void> {
    await this.slipRepo.delete(id)
  }

  async review(id: number, status: 'approved' | 'rejected'): Promise<PaperSlip> {
    const slip = await this.slipRepo.findOne({ where: { id } })
    if (!slip) throw new NotFoundException('Paper slip not found')
    slip.status = status
    return this.slipRepo.save(slip)
  }

  async drawFromBox(activityId: number, mode: 'random' | 'timeline'): Promise<{ slip: PaperSlip; record: DrawRecord } | null> {
    const slips = await this.slipRepo.find({
      where: { activityId, status: 'approved' },
      order: mode === 'timeline' ? { createdAt: 'ASC' } : { id: 'ASC' },
    })
    if (slips.length === 0) return null

    const selected = mode === 'random'
      ? slips[Math.floor(Math.random() * slips.length)]
      : slips[0]

    selected.status = 'winner'
    await this.slipRepo.save(selected)

    const record = this.drawRepo.create({
      userId: selected.userId,
      activityId,
      prizeName: `纸条: ${selected.content.substring(0, 20)}...`,
      status: 'claimed',
    })
    const saved = await this.drawRepo.save(record)

    return { slip: selected, record: saved }
  }
}