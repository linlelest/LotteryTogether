import {
  Injectable, NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Announcement } from './announcement.entity'

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly repo: Repository<Announcement>,
  ) {}

  async create(data: Partial<Announcement>): Promise<Announcement> {
    const max = await this.repo.maximum('sortOrder')
    const entity = this.repo.create({ ...data, sortOrder: (max || 0) + 1 })
    return this.repo.save(entity)
  }

  async findAll(): Promise<Announcement[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } })
  }

  async findActive(): Promise<Announcement[]> {
    return this.repo.find({ order: { isPinned: 'DESC', sortOrder: 'ASC' } })
  }

  async findById(id: number): Promise<Announcement> {
    const item = await this.repo.findOne({ where: { id } })
    if (!item) throw new NotFoundException('Announcement not found')
    return item
  }

  async update(id: number, data: Partial<Announcement>): Promise<Announcement> {
    const item = await this.findById(id)
    Object.assign(item, data)
    return this.repo.save(item)
  }

  async remove(id: number): Promise<void> {
    const item = await this.findById(id)
    await this.repo.remove(item)
  }

  async sort(ids: number[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.repo.update(ids[i], { sortOrder: i })
    }
  }

  async markAsRead(userId: number, announcementId: number): Promise<void> {
    // Simple approach: store in system_config or create a read log
    // For now, just log
    console.log(`User ${userId} read announcement ${announcementId}`)
  }
}