import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../user/user.service'
import { InviteService } from '../invite/invite.service'
import { SystemService } from '../system/system.service'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly inviteService: InviteService,
    private readonly systemService: SystemService,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string, inviteCode?: string) {
    const isFirstUser = (await this.userService.findAdminCount()) === 0

    if (isFirstUser) {
      // First user = system admin, no invite code needed
      const user = await this.userService.create({ username, password }, true)
      return this.generateTokens(user.id, username, true)
    }

    // Check if invite system is enabled
    const inviteEnabled = await this.systemService.get('inviteEnabled', 'true')
    if (inviteEnabled !== 'false') {
      if (!inviteCode) throw new UnauthorizedException('Invitation code required')
      const code = await this.inviteService.validateCode(inviteCode)
      const user = await this.userService.create({ username, password })
      await this.inviteService.markUsed(code.id, user.id)

      // Auto-assign initial codes to new user
      const initialCodes = parseInt(await this.systemService.get('initialCodes', '3'), 10)
      if (initialCodes > 0) {
        await this.inviteService.generateCodes(initialCodes, user.id)
        await this.userService.updateInviteCodeCount(user.id, initialCodes)
      }
      return this.generateTokens(user.id, username, false)
    }

    // Invite disabled - register freely
    const user = await this.userService.create({ username, password })
    return this.generateTokens(user.id, username, false)
  }

  async login(username: string, password: string) {
    const user = await this.userService.findWithPassword(username)
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new UnauthorizedException('Invalid credentials')
    return this.generateTokens(user.id, username, user.isAdmin)
  }

  async refreshToken(userId: number, username: string) {
    const user = await this.userService.findById(userId)
    return this.generateTokens(userId, username, user.isAdmin)
  }

  private generateTokens(userId: number, username: string, isAdmin: boolean) {
    const payload = { userId, username, isAdmin }
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    }
  }
}