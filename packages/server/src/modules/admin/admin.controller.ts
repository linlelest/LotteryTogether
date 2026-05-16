import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Req,
  UseGuards, Query,
} from '@nestjs/common'
import { Request } from 'express'
import { InviteService } from '../invite/invite.service'
import { UserService } from '../user/user.service'
import { SystemService } from '../system/system.service'
import { AnnouncementService } from '../system/announcement.service'
import { IpBlacklistService } from '../system/ip-blacklist.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from './admin.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'

@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly inviteService: InviteService,
    private readonly userService: UserService,
    private readonly systemService: SystemService,
    private readonly announcementService: AnnouncementService,
    private readonly ipBlacklistService: IpBlacklistService,
  ) {}

  // --- Invitation codes ---

  @Get('invite-codes')
  listCodes(@Query('ownerId') ownerId?: string) {
    if (ownerId) return this.inviteService.findByOwner(Number(ownerId))
    return this.inviteService.findAll()
  }

  @Post('invite-codes/generate')
  generateCodes(@Body() body: { count: number; ownerId?: number }) {
    return this.inviteService.generateCodes(body.count, body.ownerId)
  }

  @Post('invite-codes/assign')
  async assignCodes(@Body() body: { userId: number; count: number }) {
    const codes = await this.inviteService.generateCodes(body.count, body.userId)
    await this.userService.updateInviteCodeCount(body.userId, body.count)
    return codes
  }

  @Delete('invite-codes/:id')
  deleteCode(@Param('id', ParseIntPipe) id: number) {
    return this.inviteService.remove(id)
  }

  @Post('invite-codes/bulk-delete')
  bulkDeleteCodes(@Body() body: { ids: number[] }) {
    return this.inviteService.bulkDelete(body.ids)
  }

  @Patch('users/:userId/invite-codes')
  async updateUserCodes(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { delta: number },
  ) {
    await this.userService.updateInviteCodeCount(userId, body.delta)
    return { success: true }
  }

  // --- System config ---

  @Get('settings')
  getSettings() {
    return this.systemService.getAll()
  }

  @Patch('settings')
  updateSettings(@Body() body: Record<string, string>) {
    return Promise.all(
      Object.entries(body).map(([key, value]) => this.systemService.set(key, value)),
    )
  }

  // --- Users ---

  @Get('users')
  listUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.userService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search, status,
    })
  }

  @Post('users/:id/ban')
  async banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string; banIp: boolean; banDays: number; globalNotify: boolean },
    @Req() req: Request,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    await this.userService.ban(id, body.reason || 'No reason provided')
    if (body.banIp) {
      const ip = req.ip || req.socket?.remoteAddress || 'unknown'
      await this.ipBlacklistService.add(ip, `Banned user ${id}: ${body.reason}`, admin.userId, body.banDays)
    }
    if (body.globalNotify) {
      const user = await this.userService.findById(id)
      const days = body.banDays === -1 ? '永久' : `${body.banDays}天`
      await this.announcementService.create({
        title: '封禁通知',
        content: `用户 **${user.username}** 因「${body.reason}」被封禁 ${days}。`,
        forceRead: true,
        showDismiss: false,
        isPinned: false,
      })
    }
    return { success: true }
  }

  @Post('users/:id/unban')
  async unbanUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    const user = await this.userService.findById(id)
    await this.userService.unban(id)
    await this.announcementService.create({
      title: '解封通知',
      content: `用户 **${user.username}** 已被解封。`,
      forceRead: false,
      showDismiss: true,
      isPinned: false,
    })
    return { success: true }
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string; banIp: boolean; banDays: number; globalNotify: boolean },
    @Req() req: Request,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    const user = await this.userService.findById(id)
    const reason = body?.reason || 'No reason provided'

    if (body?.banIp) {
      const ip = req.ip || req.socket?.remoteAddress || 'unknown'
      await this.ipBlacklistService.add(ip, `Deleted user ${id}: ${reason}`, admin.userId, body.banDays || 0)
    }
    if (body?.globalNotify) {
      const days = body.banDays === -1 ? '永久' : `${body.banDays || 0}天`
      await this.announcementService.create({
        title: '用户删除通知',
        content: `用户 **${user.username}** 已被删除。原因：${reason}${body.banIp ? `，IP已封禁 ${days}` : ''}`,
        forceRead: true,
        showDismiss: false,
        isPinned: false,
      })
    }
    await this.userService.remove(id)
    return { success: true, deletedUser: user.username, reason }
  }

  // --- IP Blacklist ---

  @Get('ip-blacklist')
  listIpBlacklist() {
    return this.ipBlacklistService.findAll()
  }

  @Patch('ip-blacklist/:id')
  updateIpBlacklist(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string; days?: number },
  ) {
    return this.ipBlacklistService.update(id, body)
  }

  @Delete('ip-blacklist/:id')
  unbanIp(@Param('id', ParseIntPipe) id: number) {
    return this.ipBlacklistService.remove(id)
  }

  // --- Announcements ---

  @Get('announcements')
  listAnnouncements() {
    return this.announcementService.findAll()
  }

  @Post('announcements')
  createAnnouncement(@Body() body: any) {
    return this.announcementService.create(body)
  }

  @Patch('announcements/:id')
  updateAnnouncement(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.announcementService.update(id, body)
  }

  @Delete('announcements/:id')
  deleteAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.announcementService.remove(id)
  }

  @Post('announcements/sort')
  sortAnnouncements(@Body() body: { ids: number[] }) {
    return this.announcementService.sort(body.ids)
  }
}