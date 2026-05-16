import { Controller, Post, Get, Patch, Param, Query, Body, ParseIntPipe, UseGuards } from '@nestjs/common'
import { DrawService } from './draw.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'

@Controller('api')
export class DrawController {
  constructor(private readonly service: DrawService) {}

  @Post('draw/:activityId')
  @UseGuards(JwtAuthGuard)
  draw(
    @Param('activityId', ParseIntPipe) activityId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.draw(user.userId, activityId)
  }

  @Get('draws/me')
  @UseGuards(JwtAuthGuard)
  myRecords(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findByUser(user.userId, page ? Number(page) : 1, pageSize ? Number(pageSize) : 20)
  }

  @Get('draws/activity/:activityId')
  activityRecords(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findByActivity(activityId, page ? Number(page) : 1, pageSize ? Number(pageSize) : 50)
  }

  @Patch('draws/:id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.service.updateStatus(id, status)
  }
}