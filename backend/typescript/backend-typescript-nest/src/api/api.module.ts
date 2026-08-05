import { Module } from '@nestjs/common';

import { ApiController } from './api.controller';
import { ItemsService } from './items.service';

@Module({
  controllers: [ApiController],
  providers: [ItemsService],
})
export class ApiModule {}
