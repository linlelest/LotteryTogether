import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InviteRecord } from './invite-record.entity'

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(InviteRecord)
    private readonly repo: Repository<InviteRecord>,
  ) {}

  async record(inviterId: number, inviteeId: number, activityId?: number): Promise<InviteRecord> {
    const existing = await this.repo.findOne({ where: { inviterId, inviteeId } })
    if (existing) throw new Error('Already recorded')
    const record = this.repo.create({ inviterId, inviteeId, activityId })
    return this.repo.save(record)
  }

  async getLeaderboard(activityId?: number, limit = 10): Promise<{ inviterId: number; count: number }[]> {
    const where: any = {}
    if (activityId) where.activityId = activityId
    const result = await this.repo
      .createQueryBuilder('ir')
      .select('ir.inviterId', 'inviterId')
      .addSelect('COUNT(ir.id)', 'count')
      .where(where)
      .groupBy('ir.inviterId')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany()
    return result
  }

  async countByUser(userId: number): Promise<number> {
    return this.repo.count({ where: { inviterId: userId } })
  }

  async findInvitees(userId: number): Promise<InviteRecord[]> {
    return this.repo.find({ where: { inviterId: userId }, order: { createdAt: 'DESC' } })
  }
}