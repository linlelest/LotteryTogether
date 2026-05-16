import {
  Controller, Get, Patch, Post, Body,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'node:path'
import { UserService } from './user.service'
import { UpdateUserDto } from './dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.findById(user.userId)
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateUserDto) {
    return this.userService.update(user.userId, dto)
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const name = Date.now() + '-' + Math.round(Math.random() * 1e9)
          cb(null, name + extname(file.originalname))
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new BadRequestException('Only image files allowed'), false)
          return
        }
        cb(null, true)
      },
    }),
  )
  uploadAvatar(@CurrentUser() user: CurrentUserPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File required')
    return this.userService.updateAvatar(user.userId, file.filename)
  }
}