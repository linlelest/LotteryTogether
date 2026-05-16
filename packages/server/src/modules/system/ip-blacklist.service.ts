import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IpBlacklist } from './ip-blacklist.entity'

@Injectable()
export class IpBlacklistService {
  constructor(
    @InjectRepository(IpBlacklist)
    private readonly repo: Repository<IpBlacklist>,
  ) {}

  async add(ip: string, reason: string, bannedById: number, days: number): Promise<IpBlacklist> {
    const existing = await this.repo.findOne({ where: { ip } })
    if (existing) return existing
    const record = new IpBlacklist()
    record.ip = ip
    record.reason = reason
    record.bannedById = bannedById
    if (days !== -1) record.unbanAt = new Date(Date.now() + days * 86400000)
    return this.repo.save(record)
  }

  async findAll(): Promise<IpBlacklist[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } })
  }

  async findById(id: number): Promise<IpBlacklist> {
    const record = await this.repo.findOne({ where: { id } })
    if (!record) throw new NotFoundException('IP blacklist record not found')
    return record
  }

  async update(id: number, data: { reason?: string; days?: number }): Promise<IpBlacklist> {
    const record = await this.findById(id)
    if (data.reason !== undefined) record.reason = data.reason
    if (data.days !== undefined) {
      record.unbanAt = data.days === -1 ? null : new Date(Date.now() + data.days * 86400000)
    }
    return this.repo.save(record)
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id)
  }

  async isBlocked(ip: string): Promise<boolean> {
    const record = await this.repo.findOne({
      where: { ip },
      order: { createdAt: 'DESC' },
    })
    if (!record) return false
    if (record.unbanAt && new Date() > record.unbanAt) {
      await this.repo.remove(record)
      return false
    }
    return true
  }
}