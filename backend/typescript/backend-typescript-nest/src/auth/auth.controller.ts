import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { AuthResponse, CredentialsDto, UserProfileResponse } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: CredentialsDto): Promise<AuthResponse> {
    return this.authService.register(body ?? {});
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: CredentialsDto): Promise<AuthResponse> {
    return this.authService.login(body ?? {});
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(): void {
    // Stateless Bearer JWT: nothing to invalidate server-side.
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() username: string): Promise<UserProfileResponse> {
    return this.authService.profile(username);
  }
}
