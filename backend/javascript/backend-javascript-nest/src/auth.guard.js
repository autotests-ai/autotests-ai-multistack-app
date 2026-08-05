'use strict';

const { Injectable } = require('@nestjs/common');

const { AuthService } = require('./auth.service');
const { injectConstructor } = require('./di');

@Injectable()
class AuthGuard {
  constructor(auth) {
    this.auth = auth;
  }

  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    request.user = await this.auth.profile(request.headers.authorization);
    return true;
  }
}

injectConstructor(AuthGuard, AuthService);

module.exports = { AuthGuard };
