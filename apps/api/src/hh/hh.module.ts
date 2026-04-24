import { Module } from '@nestjs/common'

import { HhController } from './hh.controller.js'
import { HhService } from './hh.service.js'

@Module({
  controllers: [HhController],
  providers: [HhService],
  exports: [HhService],
})
export class HhModule {}
