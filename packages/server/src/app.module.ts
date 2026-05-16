import { Module, ValidationPipe, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'node:path'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './modules/user/user.module'
import { AuthModule } from './modules/auth/auth.module'
import { InviteModule } from './modules/invite/invite.module'
import { SystemModule } from './modules/system/system.module'
import { AdminModule } from './modules/admin/admin.module'
import { ActivityModule } from './modules/activity/activity.module'
import { PrizeModule } from './modules/prize/prize.module'
import { DrawModule } from './modules/draw/draw.module'
import { ShareModule } from './modules/share/share.module'
import { WsModule } from './modules/ws/ws.module'
import { UploadModule } from './modules/upload/upload.module'
import { AuditMiddleware } from './common/middleware/audit.middleware'
import { IpBanMiddleware } from './common/middleware/ip-ban.middleware'

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'sqljs',
        location: config.get('DB_PATH', './data/lottery.db'),
        autoSave: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production',
        autoLoadEntities: true,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UserModule, AuthModule, InviteModule, SystemModule, AdminModule,
    ActivityModule, PrizeModule, DrawModule, ShareModule, WsModule, UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useFactory: () => new ValidationPipe({ whitelist: true, transform: true }) },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IpBanMiddleware, AuditMiddleware).forRoutes('*')
  }
}