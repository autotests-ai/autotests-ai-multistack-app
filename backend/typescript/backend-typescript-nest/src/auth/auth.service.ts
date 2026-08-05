import { HttpStatus, Inject, Injectable } from '@nestjs/common';

import { ApiException } from '../common/api-exception';
import { validateCredentials } from '../common/validation';
import { POST_AUTH_REDIRECT } from '../config';
import { JwtService } from '../security/jwt.service';
import { checkPassword, hashPassword } from '../security/password';
import { STORE, UsernameTakenError, type Store } from '../store/store';

import type { AuthResponse, CredentialsDto, UserProfileResponse } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(STORE) private readonly store: Store,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: CredentialsDto): Promise<AuthResponse> {
    const { username, password } = this.requireValid(body);

    if ((await this.store.findUserByUsername(username)) !== null) {
      throw new ApiException(HttpStatus.CONFLICT, 'Username already taken');
    }

    try {
      await this.store.insertUser(username, await hashPassword(password));
    } catch (error) {
      // A concurrent insert that won the race must surface as 409, not 500.
      if (error instanceof UsernameTakenError) {
        throw new ApiException(HttpStatus.CONFLICT, 'Username already taken');
      }
      throw error;
    }

    return this.authResponse(username);
  }

  async login(body: CredentialsDto): Promise<AuthResponse> {
    const { username, password } = this.requireValid(body);

    const user = await this.store.findUserByUsername(username);
    if (user === null || !(await checkPassword(password, user.passwordHash))) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, 'Wrong login or password');
    }

    return this.authResponse(username);
  }

  async profile(username: string): Promise<UserProfileResponse> {
    if ((await this.store.findUserByUsername(username)) === null) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, 'Unauthorized');
    }
    return { username };
  }

  private requireValid(body: CredentialsDto): { username: string; password: string } {
    const error = validateCredentials(body?.username, body?.password);
    if (error !== null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, error);
    }
    return { username: body.username as string, password: body.password as string };
  }

  private authResponse(username: string): AuthResponse {
    return {
      token: this.jwtService.createToken(username),
      username,
      redirectUrl: POST_AUTH_REDIRECT,
    };
  }
}
