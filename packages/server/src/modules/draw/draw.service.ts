import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, MoreThan } from 'typeorm'
import { DrawRecord } from './draw-record.entity'
import { Prize } from '../prize/prize.entity'
import { Activity } from '../activity/activity.entity'
import { WsGateway } from '../ws/ws.gateway'

@Injectable()
export class DrawService {
  constructor(
    @InjectRepository(DrawRecord)
    private readonly drawRepo: Repository<DrawRecord>,
    @InjectRepository(Prize)
    private readonly prizeRepo: Repository<Prize>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    private readonly dataSource: DataSource,
    private readonly wsGateway: WsGateway,
  ) {}

  async draw(userId: number, activityId: number): Promise<{ prize: Prize | null; record: DrawRecord }> {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } })
    if (!activity || activity.status !== 'active') {
      throw new BadRequestException('Activity is not active')
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const prizes = await manager.find(Prize, { where: { activityId }, order: { weight: 'DESC' } })
      if (prizes.length === 0) throw new BadRequestException('No prizes configured')

      // Filter to only in-stock prizes
      const available = prizes.filter((p) => p.stock > 0)
      if (available.length === 0) {
        const totalStock = prizes.reduce((s, p) => s + p.stock, 0)
        throw new BadRequestException(`所有奖品已耗尽（共 ${prizes.length} 个奖品，剩余库存 ${totalStock}）`)
      }

      const selected = this.weightedRandom(available)

      // Atomic stock decrement using decrement + stock check
      // sql.js serializes transactions so this is safe
      const prize = await manager.findOne(Prize, { where: { id: selected.id } })
      if (!prize || prize.stock <= 0) throw new BadRequestException('该奖品库存已耗尽')
      await manager.decrement(Prize, { id: selected.id }, 'stock', 1)

      const record = manager.create(DrawRecord, {
        userId, activityId,
        prizeId: selected.id,
        prizeName: selected.name,
        status: 'pending',
      })
      const saved = await manager.save(record)
      await manager.increment(Activity, { id: activityId }, 'participantCount', 1)

      return { prize: selected, record: saved }
    })

    // Emit WebSocket events
    this.wsGateway.emitDrawResult(activityId, {
      userId, prizeName: result.prize.name,
      drawnAt: result.record.drawnAt.toISOString(),
    })

    const participantCount = await this.activityRepo.findOne({ where: { id: activityId } }).then(a => a?.participantCount || 0)
    this.wsGateway.emitParticipantCount(activityId, participantCount)

    return result
  }

  private weightedRandom(prizes: Prize[]): Prize {
    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0)
    let rand = Math.random() * totalWeight
    for (const prize of prizes) {
      rand -= prize.weight
      if (rand <= 0) return prize
    }
    return prizes[prizes.length - 1]
  }

  async findByUser(userId: number, page = 1, pageSize = 20): Promise<{ items: DrawRecord[]; total: number }> {
    const [items, total] = await this.drawRepo.findAndCount({
      where: { userId },
      order: { drawnAt: 'DESC' },
      skip: (page - 1) * pageSize, take: pageSize,
      relations: ['activity', 'prize'],
    })
    return { items, total }
  }

  async findByActivity(activityId: number, page = 1, pageSize = 50): Promise<{ items: DrawRecord[]; total: number }> {
    const [items, total] = await this.drawRepo.findAndCount({
      where: { activityId },
      order: { drawnAt: 'DESC' },
      skip: (page - 1) * pageSize, take: pageSize,
      relations: ['user', 'prize'],
    })
    return { items, total }
  }

  async updateStatus(id: number, status: string): Promise<DrawRecord> {
    await this.drawRepo.update(id, { status: status as any })
    return this.drawRepo.findOne({ where: { id } }) as Promise<DrawRecord>
  }
}