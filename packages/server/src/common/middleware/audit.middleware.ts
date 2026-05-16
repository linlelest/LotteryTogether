import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Audit')

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now()
    const { method, originalUrl, ip } = req

    res.on('finish', () => {
      const duration = Date.now() - start
      if (res.statusCode >= 400) {
        this.logger.warn(`${method} ${originalUrl} ${res.statusCode} ${duration}ms - ${ip}`)
      } else if (duration > 1000) {
        this.logger.log(`${method} ${originalUrl} ${res.statusCode} ${duration}ms (slow) - ${ip}`)
      }
    })

    next()
  }
}