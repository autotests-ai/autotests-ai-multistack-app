'use strict';

const { Controller, Get } = require('@nestjs/common');

const { injectConstructor } = require('./di');
const { STORE, SETTINGS } = require('./tokens');

@Controller('api')
class ApiController {
  constructor(store, settings) {
    this.store = store;
    this.serviceName = settings.serviceName;
  }

  @Get('health')
  health() {
    return { status: 'ok', service: this.serviceName };
  }

  @Get('items')
  async items() {
    return { items: await this.store.listItems(), source: 'postgresql' };
  }
}

injectConstructor(ApiController, STORE, SETTINGS);

module.exports = { ApiController };
