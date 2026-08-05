import { Controller, Get, Inject } from '@nestjs/common';

import { APP_CONFIG } from '../config.module';
import type { AppConfig } from '../config';

import { ItemsService } from './items.service';

interface HealthResponse {
  status: string;
  service: string;
}

interface ItemsResponse {
  items: { id: number; name: string; description: string }[];
  source: string;
}

@Controller()
export class ApiController {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly items: ItemsService,
  ) {}

  @Get('health')
  health(): HealthResponse {
    return { status: 'ok', service: this.config.serviceName };
  }

  @Get('items')
  async listItems(): Promise<ItemsResponse> {
    return { items: await this.items.list(), source: 'postgresql' };
  }
}
