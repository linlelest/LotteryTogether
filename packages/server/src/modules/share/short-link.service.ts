import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomBytes } from 'node:crypto'
import { ShortLink } from './short-link.entity'

@Injectable()
export class ShortLinkService {
  constructor(
    @InjectRepository(ShortLink)
    private readonly repo: Repository<ShortLink>,
  ) {}

  async create(targetUrl: string, activityId?: number, creatorId?: number): Promise<ShortLink> {
    const code = randomBytes(4).toString('base64url').substring(0, 6)
    const entity = this.repo.create({ code, targetUrl, activityId, creatorId })
    return this.repo.save(entity)
  }

  async resolve(code: string): Promise<ShortLink> {
    const link = await this.repo.findOne({ where: { code } })
    if (!link) throw new NotFoundException('Link not found')
    link.clickCount++
    await this.repo.save(link)
    return link
  }

  async findByActivity(activityId: number): Promise<ShortLink[]> {
    return this.repo.find({ where: { activityId }, order: { createdAt: 'DESC' } })
  }

  async findByUser(userId: number): Promise<ShortLink[]> {
    return this.repo.find({ where: { creatorId: userId }, order: { createdAt: 'DESC' } })
  }
}