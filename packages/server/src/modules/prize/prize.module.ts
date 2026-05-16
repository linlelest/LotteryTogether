import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Prize } from './prize.entity'
import { PrizeService } from './prize.service'
import { PrizeController } from './prize.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Prize])],
  providers: [PrizeService],
  controllers: [PrizeController],
  exports: [PrizeService],
})
export class PrizeModule {}