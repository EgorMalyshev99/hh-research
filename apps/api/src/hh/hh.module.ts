import { Module } from '@nestjs/common'
import { HhService } from './hh.service.js'

/** Модуль для интеграции с hh.ru API */
@Module({
  providers: [HhService],
  exports: [HhService],
})
export class HhModule {}
