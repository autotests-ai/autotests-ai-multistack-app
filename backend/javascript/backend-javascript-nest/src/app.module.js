'use strict';

const { Module } = require('@nestjs/common');

const { ApiController } = require('./api.controller');
const { AuthController } = require('./auth.controller');
const { AuthGuard } = require('./auth.guard');
const { AuthService } = require('./auth.service');
const { JwtService } = require('./jwt.service');
const { STORE, SETTINGS } = require('./tokens');

@Module({})
class AppModule {
  /** The store and the settings are values, so tests can register a fake store. */
  static register({ store, settings }) {
    return {
      module: AppModule,
      controllers: [ApiController, AuthController],
      providers: [
        { provide: STORE, useValue: store },
        { provide: SETTINGS, useValue: settings },
        JwtService,
        AuthService,
        AuthGuard,
      ],
    };
  }
}

module.exports = { AppModule };
