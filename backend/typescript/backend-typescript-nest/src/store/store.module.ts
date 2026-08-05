import { Global, Module, type DynamicModule } from '@nestjs/common';

import { STORE, type Store } from './store';

@Global()
@Module({})
export class StoreModule {
  /** Binds the persistence seam; production passes a `PostgresStore`, tests a fake. */
  static forStore(store: Store): DynamicModule {
    return {
      module: StoreModule,
      providers: [{ provide: STORE, useValue: store }],
      exports: [STORE],
    };
  }
}
