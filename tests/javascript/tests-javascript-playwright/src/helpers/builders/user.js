const { faker } = require('@faker-js/faker');

class User {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  welcomeMessage() {
    return `Welcome, ${this.username}!`;
  }
}

exports.User = User;

exports.UserBuilder = class UserBuilder {
  constructor() {
    this.username = '';
    this.password = '';
  }

  withUsername() {
    this.username = `user_${faker.string.alphanumeric(8).toLowerCase()}`;
    return this;
  }

  withPassword() {
    this.password = faker.internet.password({ length: 12 });
    return this;
  }

  /** Seeded demo user on the teaching stack */
  withSeededUser() {
    this.username = 'user1';
    this.password = 'password1';
    return this;
  }

  build() {
    return new User(this.username, this.password);
  }
};
