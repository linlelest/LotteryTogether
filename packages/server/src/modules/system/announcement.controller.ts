import { Controller, Get, Post, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import { AnnouncementService } from './announcement.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'

@Controller('api/announcements')
export class AnnouncementController {
  constructor(private readonly service: AnnouncementService) {}

  @Get()
  findAll() {
    return this.service.findActive()
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.markAsRead(user.userId, id)
  }
}