import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { IpBlacklistService } from '../../modules/system/ip-blacklist.service'

@Injectable()
export class IpBanMiddleware implements NestMiddleware {
  constructor(private readonly ipBlacklistService: IpBlacklistService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Skip auth endpoints for registration
    if (req.path.startsWith('/api/auth/')) return next()
    if (req.path.startsWith('/api/admin/ip-blacklist')) return next()
    if (req.path.startsWith('/uploads')) return next()

    const ip = req.ip || req.socket?.remoteAddress || ''
    const blocked = await this.ipBlacklistService.isBlocked(ip)
    if (blocked) throw new UnauthorizedException('Your IP has been blocked')

    next()
  }
}