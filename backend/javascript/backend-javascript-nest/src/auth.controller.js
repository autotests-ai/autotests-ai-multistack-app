'use strict';

const {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  UseGuards,
} = require('@nestjs/common');

const { AuthService } = require('./auth.service');
const { AuthGuard } = require('./auth.guard');
const { injectConstructor, decorateParams } = require('./di');

@Controller('api/auth')
class AuthController {
  constructor(auth) {
    this.auth = auth;
  }

  @Post('register')
  @HttpCode(201)
  async register(body) {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(200)
  async login(body) {
    return this.auth.login(body);
  }

  @Post('logout')
  @HttpCode(204)
  logout() {
    return undefined;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(request) {
    return { username: request.user.username };
  }
}

injectConstructor(AuthController, AuthService);
decorateParams(AuthController, 'register', Body());
decorateParams(AuthController, 'login', Body());
decorateParams(AuthController, 'me', Req());

module.exports = { AuthController };
