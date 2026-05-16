import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ShortLink } from './short-link.entity'
import { InviteRecord } from './invite-record.entity'
import { ShortLinkService } from './short-link.service'
import { InviteService } from './invite.service'
import { ShareController } from './share.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ShortLink, InviteRecord])],
  providers: [ShortLinkService, InviteService],
  controllers: [ShareController],
  exports: [ShortLinkService, InviteService],
})
export class ShareModule {}