import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ShortLinkService } from './short-link.service'
import { InviteService } from './invite.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'

@Controller('api')
export class ShareController {
  constructor(
    private readonly shortLinkService: ShortLinkService,
    private readonly inviteService: InviteService,
  ) {}

  // Short links
  @Post('short-links')
  @UseGuards(JwtAuthGuard)
  createShortLink(@Body() body: { targetUrl: string; activityId?: number }, @CurrentUser() user: CurrentUserPayload) {
    return this.shortLinkService.create(body.targetUrl, body.activityId, user.userId)
  }

  @Get('short-links/:code')
  resolveShortLink(@Param('code') code: string) {
    return this.shortLinkService.resolve(code)
  }

  // Invite leaderboard
  @Get('invite/leaderboard')
  getLeaderboard(@Query('activityId') activityId?: string) {
    return this.inviteService.getLeaderboard(activityId ? Number(activityId) : undefined)
  }

  @Get('invite/my')
  @UseGuards(JwtAuthGuard)
  getMyInvites(@CurrentUser() user: CurrentUserPayload) {
    return this.inviteService.findInvitees(user.userId)
  }

  @Get('invite/count')
  @UseGuards(JwtAuthGuard)
  getInviteCount(@CurrentUser() user: CurrentUserPayload) {
    return this.inviteService.countByUser(user.userId)
  }

  // Called during registration to record invite
  @Post('invite/record')
  @UseGuards(JwtAuthGuard)
  recordInvite(@Body() body: { inviterId: number; activityId?: number }, @CurrentUser() user: CurrentUserPayload) {
    return this.inviteService.record(body.inviterId, user.userId, body.activityId)
  }
}