import { Controller, Post, Get, Delete, Param, Query, Body, ParseIntPipe, UseGuards } from '@nestjs/common'
import { PaperSlipService } from './paper-slip.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'

@Controller('api/paper-slips')
export class PaperSlipController {
  constructor(private readonly service: PaperSlipService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  submit(@Body() body: { activityId: number; content: string }, @CurrentUser() user: CurrentUserPayload) {
    return this.service.submit(body.activityId, user.userId, body.content)
  }

  @Get(':activityId/status')
  getStatus(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.service.getDrawStatus(activityId)
  }

  @Get(':activityId')
  list(@Param('activityId', ParseIntPipe) activityId: number, @Query('status') status?: string) {
    return this.service.findByActivity(activityId, status)
  }

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  review(@Param('id', ParseIntPipe) id: number, @Body('status') status: 'approved' | 'rejected') {
    return this.service.review(id, status)
  }

  @Post(':activityId/draw')
  @UseGuards(JwtAuthGuard)
  drawFromBox(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body('mode') mode: 'random' | 'timeline',
  ) {
    return this.service.drawFromBox(activityId, mode)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}