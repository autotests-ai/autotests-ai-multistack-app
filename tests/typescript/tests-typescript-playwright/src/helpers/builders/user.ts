import { faker } from '@faker-js/faker';

export class User {
  constructor(
    readonly username: string,
    readonly password: string,
  ) {}

  welcomeMessage(): string {
    return `Welcome, ${this.username}!`;
  }
}

export class UserBuilder {
  private username = '';
  private password = '';

  withUsername(): this {
    this.username = `user_${faker.string.alphanumeric(8).toLowerCase()}`;
    return this;
  }

  withPassword(): this {
    this.password = faker.internet.password({ length: 12 });
    return this;
  }

  build(): User {
    return new User(this.username, this.password);
  }
}
