import { faker } from '@faker-js/faker';

export type BuiltUser = {
  username?: string;
  password?: string;
};

export class UserBuilder {
  private user: BuiltUser = {};

  withUsername(): this {
    this.user.username = `user_${faker.string.alphanumeric(8).toLowerCase()}`;
    return this;
  }

  withPassword(): this {
    this.user.password = faker.internet.password({ length: 12 });
    return this;
  }

  /** Seeded demo user on the teaching stack */
  withSeededUser(): this {
    this.user.username = 'user1';
    this.user.password = 'password1';
    return this;
  }

  build(): BuiltUser {
    return { ...this.user };
  }
}
