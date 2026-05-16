import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  UseGuards,
} from '@nestjs/common'
import { PrizeService } from './prize.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/prizes')
export class PrizeController {
  constructor(private readonly service: PrizeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get('activity/:activityId')
  findByActivity(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.service.findByActivityId(activityId)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Post('bulk/:activityId')
  @UseGuards(JwtAuthGuard)
  bulkCreate(@Param('activityId', ParseIntPipe) activityId: number, @Body('prizes') prizes: any[]) {
    return this.service.bulkCreate(activityId, prizes)
  }
}