import { Controller, Get, Post, UseGuards, Res, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common'
import { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { join } from 'node:path'
import { existsSync, renameSync, writeFileSync, utimesSync } from 'node:fs'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'

@Controller('api/admin/backup')
@UseGuards(JwtAuthGuard, AdminGuard)
export class BackupController {
  @Get('download')
  download(@Res() res: Response) {
    const dbPath = join(__dirname, '..', '..', '..', 'data', 'lottery.db')
    if (!existsSync(dbPath)) return res.status(404).json({ message: 'Database not found' })
    res.download(dbPath, 'lottery-backup.db')
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) return { success: false, message: 'No file uploaded' }
    const dbPath = join(__dirname, '..', '..', '..', 'data', 'lottery.db')
    const backupPath = dbPath + '.bak'
    if (existsSync(dbPath)) renameSync(dbPath, backupPath)
    try {
      writeFileSync(dbPath, file.buffer)
      // Touch main.ts to trigger auto-restart in watch mode
      const mainPath = join(__dirname, '..', 'main.js')
      if (existsSync(mainPath)) {
        const now = new Date()
        utimesSync(mainPath, now, now)
      }
      return { success: true }
    } catch {
      if (existsSync(backupPath)) renameSync(backupPath, dbPath)
      return { success: false, message: 'Import failed' }
    }
  }
}