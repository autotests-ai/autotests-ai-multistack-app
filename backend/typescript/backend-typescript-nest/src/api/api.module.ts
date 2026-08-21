import { Module } from '@nestjs/common';

import { ApiController } from './api.controller';
import { ItemsService } from './items.service';
import { OpenApiController } from './openapi.controller';

@Module({
  controllers: [ApiController, OpenApiController],
  providers: [ItemsService],
})
export class ApiModule {}
