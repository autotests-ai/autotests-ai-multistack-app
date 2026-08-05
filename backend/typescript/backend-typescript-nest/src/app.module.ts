import { Module, type DynamicModule } from '@nestjs/common';

import { ApiModule } from './api/api.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config.module';
import { SecurityModule } from './security/security.module';
import { StoreModule } from './store/store.module';
import type { AppConfig } from './config';
import type { Store } from './store/store';

export interface AppModuleOptions {
  config: AppConfig;
  store: Store;
}

@Module({})
export class AppModule {
  static forRoot(options: AppModuleOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot(options.config),
        StoreModule.forStore(options.store),
        SecurityModule,
        ApiModule,
        AuthModule,
      ],
    };
  }
}
