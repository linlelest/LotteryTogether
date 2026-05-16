import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Activity } from './activity.entity'
import { Prize } from '../prize/prize.entity'
import { ActivityService } from './activity.service'
import { ActivityController } from './activity.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Prize])],
  providers: [ActivityService],
  controllers: [ActivityController],
  exports: [ActivityService],
})
export class ActivityModule {}