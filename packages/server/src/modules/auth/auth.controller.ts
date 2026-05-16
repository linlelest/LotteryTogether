import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'
import { UserService } from '../user/user.service'
import { SystemService } from '../system/system.service'
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator'

class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username: string

  @IsString()
  @MinLength(6)
  password: string

  @IsOptional()
  @IsString()
  inviteCode?: string
}

class LoginDto {
  @IsString()
  username: string

  @IsString()
  password: string
}

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly systemService: SystemService,
  ) {}

  @Get('needs-setup')
  async needsSetup() {
    const count = await this.userService.findAdminCount()
    return { needsSetup: count === 0 }
  }

  @Get('invite-info')
  async getInviteInfo() {
    const enabled = await this.systemService.get('inviteEnabled', 'true')
    const hint = await this.systemService.get('inviteHint', '请向管理员获取邀请码。')
    return { enabled: enabled !== 'false', hint }
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.password, dto.inviteCode)
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password)
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  refresh(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.refreshToken(user.userId, user.username)
  }
}