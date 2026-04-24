import { Module } from '@nestjs/common'

import { HistoryController, StatsController } from './history.controller.js'

@Module({
  controllers: [HistoryController, StatsController],
})
export class HistoryModule {}
