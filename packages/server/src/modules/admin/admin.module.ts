import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { BackupController } from './backup.controller'
import { InviteModule } from '../invite/invite.module'
import { UserModule } from '../user/user.module'

@Module({
  imports: [InviteModule, UserModule],
  controllers: [AdminController, BackupController],
})
export class AdminModule {}