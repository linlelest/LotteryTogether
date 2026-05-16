import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SystemConfig } from './system-config.entity'
import { Announcement } from './announcement.entity'
import { IpBlacklist } from './ip-blacklist.entity'
import { SystemService } from './system.service'
import { AnnouncementService } from './announcement.service'
import { IpBlacklistService } from './ip-blacklist.service'
import { AnnouncementController } from './announcement.controller'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig, Announcement, IpBlacklist])],
  providers: [SystemService, AnnouncementService, IpBlacklistService],
  controllers: [AnnouncementController],
  exports: [SystemService, AnnouncementService, IpBlacklistService],
})
export class SystemModule {}