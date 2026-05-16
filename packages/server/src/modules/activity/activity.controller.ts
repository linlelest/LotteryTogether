import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe,
  UseGuards, NotFoundException,
} from '@nestjs/common'
import { ActivityService } from './activity.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'
import { ActivityStatus } from './activity.entity'

@Controller('api/activities')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any, @CurrentUser() user: CurrentUserPayload) {
    const data = {
      ...body,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    }
    return this.service.create(data, user.userId)
  }

  @Get('public')
  findAllPublic(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('mode') mode?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllPublic({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      mode: mode as any,
      status: status as any,
      search,
    })
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('mode') mode?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      mode, status, search,
    })
  }

  @Get('by-code/:code')
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code)
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id)
  }

  @Post(':id/verify-password')
  verifyPassword(@Param('id', ParseIntPipe) id: number, @Body('password') password: string) {
    return this.service.verifyPassword(id, password)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const data = {
      ...body,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    }
    return this.service.update(id, data)
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  transition(@Param('id', ParseIntPipe) id: number, @Body('status') status: ActivityStatus) {
    return this.service.transition(id, status)
  }

  @Post(':id/force-end')
  @UseGuards(JwtAuthGuard)
  forceEnd(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.forceEnd(id, reason, user.userId)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}