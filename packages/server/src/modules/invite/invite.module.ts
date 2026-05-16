import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InvitationCode } from './invitation-code.entity'
import { InviteService } from './invite.service'

@Module({
  imports: [TypeOrmModule.forFeature([InvitationCode])],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}