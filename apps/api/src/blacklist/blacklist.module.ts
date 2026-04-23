import { Module } from '@nestjs/common'
import { BlacklistController } from './blacklist.controller.js'
import { BlacklistService } from './blacklist.service.js'

@Module({
  controllers: [BlacklistController],
  providers: [BlacklistService],
  exports: [BlacklistService],
})
export class BlacklistModule {}
