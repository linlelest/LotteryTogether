import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Prize } from './prize.entity'

@Injectable()
export class PrizeService {
  constructor(
    @InjectRepository(Prize)
    private readonly repo: Repository<Prize>,
  ) {}

  async create(data: Partial<Prize>): Promise<Prize> {
    const entity = this.repo.create(data)
    return this.repo.save(entity)
  }

  async findByActivityId(activityId: number): Promise<Prize[]> {
    return this.repo.find({ where: { activityId }, order: { weight: 'DESC' } })
  }

  async findById(id: number): Promise<Prize> {
    const prize = await this.repo.findOne({ where: { id } })
    if (!prize) throw new NotFoundException('Prize not found')
    return prize
  }

  async update(id: number, data: Partial<Prize>): Promise<Prize> {
    const prize = await this.findById(id)
    Object.assign(prize, data)
    return this.repo.save(prize)
  }

  async remove(id: number): Promise<void> {
    const prize = await this.findById(id)
    await this.repo.remove(prize)
  }

  async bulkCreate(activityId: number, prizes: Partial<Prize>[]): Promise<Prize[]> {
    const entities = prizes.map((p) => this.repo.create({ ...p, activityId }))
    return this.repo.save(entities)
  }
}