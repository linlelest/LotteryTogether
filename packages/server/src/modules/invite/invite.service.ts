import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomBytes } from 'node:crypto'
import { InvitationCode } from './invitation-code.entity'

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(InvitationCode)
    private readonly codeRepo: Repository<InvitationCode>,
  ) {}

  async generateCodes(count: number, ownerId?: number): Promise<InvitationCode[]> {
    const codes: InvitationCode[] = []
    for (let i = 0; i < count; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase()
      const entity = this.codeRepo.create({ code, ownerId })
      codes.push(entity)
    }
    return this.codeRepo.save(codes)
  }

  async validateCode(code: string): Promise<InvitationCode> {
    const record = await this.codeRepo.findOne({ where: { code } })
    if (!record) throw new BadRequestException('Invalid invitation code')
    if (record.isUsed) throw new BadRequestException('Invitation code already used')
    return record
  }

  async markUsed(codeId: number, userId: number): Promise<void> {
    await this.codeRepo.update(codeId, { isUsed: true, usedById: userId, usedAt: new Date() })
  }

  async findAll(): Promise<InvitationCode[]> {
    return this.codeRepo.find({ order: { createdAt: 'DESC' } })
  }

  async findUnused(): Promise<InvitationCode[]> {
    return this.codeRepo.find({ where: { isUsed: false }, order: { createdAt: 'DESC' } })
  }

  async findByOwner(ownerId: number): Promise<InvitationCode[]> {
    return this.codeRepo.find({ where: { ownerId }, order: { createdAt: 'DESC' } })
  }

  async assignToUser(codeIds: number[], ownerId: number): Promise<void> {
    await this.codeRepo.update(codeIds, { ownerId })
  }

  async remove(id: number): Promise<void> {
    const record = await this.codeRepo.findOne({ where: { id } })
    if (!record) throw new NotFoundException('Invitation code not found')
    if (record.isUsed) throw new BadRequestException('Cannot delete a used invitation code')
    await this.codeRepo.remove(record)
  }

  async bulkDelete(ids: number[]): Promise<void> {
    for (const id of ids) {
      try { await this.remove(id) } catch { /* skip */ }
    }
  }

  async count(): Promise<number> {
    return this.codeRepo.count()
  }

  async countUnused(): Promise<number> {
    return this.codeRepo.count({ where: { isUsed: false } })
  }
}