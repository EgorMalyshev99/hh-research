import { Module } from '@nestjs/common'

import { HhController } from './hh.controller.js'
import { HhService } from './hh.service.js'

/** Модуль для интеграции с hh.ru API */
@Module({
  controllers: [HhController],
  providers: [HhService],
  exports: [HhService],
})
export class HhModule {}
