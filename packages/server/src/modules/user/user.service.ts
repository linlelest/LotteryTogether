import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from './user.entity'
import { CreateUserDto, UpdateUserDto } from './dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto, isAdmin = false): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } })
    if (existing) throw new ConflictException('Username already taken')
    const hashed = await bcrypt.hash(dto.password, 10)
    const user = this.userRepo.create({ ...dto, password: hashed, isAdmin })
    return this.userRepo.save(user)
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } })
  }

  async findWithPassword(username: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'password', 'isAdmin', 'avatar', 'isBanned', 'inviteCodeCount', 'createdAt', 'updatedAt'],
    })
  }

  async findAdminCount(): Promise<number> {
    return this.userRepo.count({ where: { isAdmin: true } })
  }

  async findAll(params: {
    page?: number; pageSize?: number; search?: string; status?: string
  }): Promise<{ items: User[]; total: number; page: number; pageSize: number }> {
    const page = params.page || 1
    const pageSize = Math.min(params.pageSize || 50, 200)
    const where: any = {}
    if (params.search) where.username = Like(`%${params.search}%`)
    if (params.status === 'banned') where.isBanned = true
    if (params.status === 'active') where.isBanned = false
    const [items, total] = await this.userRepo.findAndCount({
      where, order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize, take: pageSize,
    })
    return { items, total, page, pageSize }
  }

  async ban(id: number, reason: string): Promise<User> {
    const user = await this.findById(id)
    user.isBanned = true
    user.banReason = reason
    user.bannedAt = new Date()
    return this.userRepo.save(user)
  }

  async unban(id: number): Promise<User> {
    const user = await this.findById(id)
    user.isBanned = false
    user.banReason = null
    user.bannedAt = null
    return this.userRepo.save(user)
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id)
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10)
    Object.assign(user, dto)
    return this.userRepo.save(user)
  }

  async updateInviteCodeCount(id: number, delta: number): Promise<User> {
    const user = await this.findById(id)
    user.inviteCodeCount = Math.max(0, user.inviteCodeCount + delta)
    return this.userRepo.save(user)
  }

  async updateAvatar(id: number, filename: string): Promise<User> {
    const user = await this.findById(id)
    user.avatar = `/uploads/${filename}`
    return this.userRepo.save(user)
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id)
    await this.userRepo.remove(user)
  }
}