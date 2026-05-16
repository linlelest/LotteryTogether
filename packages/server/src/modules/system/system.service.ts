import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SystemConfig } from './system-config.entity'

const DEFAULTS: Record<string, string> = {
  inviteEnabled: 'true',
  initialCodes: '3',
  inviteRewardCodes: '1',
  inviteHint: '## 获取邀请码\n\n请联系系统管理员获取邀请码。\n\n> 邀请码为注册时必需，每个邀请码只能使用一次。',
}

@Injectable()
export class SystemService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
  ) {}

  async onModuleInit() {
    for (const [key, value] of Object.entries(DEFAULTS)) {
      const existing = await this.configRepo.findOne({ where: { key } })
      if (!existing) {
        await this.configRepo.save(this.configRepo.create({ key, value }))
      }
    }
  }

  async get(key: string, defaultValue = ''): Promise<string> {
    const record = await this.configRepo.findOne({ where: { key } })
    return record?.value ?? defaultValue
  }

  async set(key: string, value: string): Promise<SystemConfig> {
    const existing = await this.configRepo.findOne({ where: { key } })
    if (existing) {
      existing.value = value
      return this.configRepo.save(existing)
    }
    return this.configRepo.save(this.configRepo.create({ key, value }))
  }

  async getAll(): Promise<SystemConfig[]> {
    return this.configRepo.find()
  }
}