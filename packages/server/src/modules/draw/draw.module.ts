import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DrawRecord } from './draw-record.entity'
import { PaperSlip } from './paper-slip.entity'
import { Prize } from '../prize/prize.entity'
import { Activity } from '../activity/activity.entity'
import { DrawService } from './draw.service'
import { PaperSlipService } from './paper-slip.service'
import { DrawController } from './draw.controller'
import { PaperSlipController } from './paper-slip.controller'

@Module({
  imports: [TypeOrmModule.forFeature([DrawRecord, PaperSlip, Prize, Activity])],
  providers: [DrawService, PaperSlipService],
  controllers: [DrawController, PaperSlipController],
  exports: [DrawService, PaperSlipService],
})
export class DrawModule {}