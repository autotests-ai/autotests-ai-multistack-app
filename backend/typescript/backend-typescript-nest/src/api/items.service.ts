import { Inject, Injectable } from '@nestjs/common';

import { STORE, type ItemRecord, type Store } from '../store/store';

@Injectable()
export class ItemsService {
  constructor(@Inject(STORE) private readonly store: Store) {}

  list(): Promise<ItemRecord[]> {
    return this.store.listItems();
  }
}
