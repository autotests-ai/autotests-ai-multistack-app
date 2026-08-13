const { faker } = require('@faker-js/faker');

exports.UserBuilder = class UserBuilder {
  constructor() {
    this.user = {};
  }

  withUsername() {
    this.user.username = `user_${faker.string.alphanumeric(8).toLowerCase()}`;
    return this;
  }

  withPassword() {
    this.user.password = faker.internet.password({ length: 12 });
    return this;
  }

  /** Seeded demo user on the teaching stack */
  withSeededUser() {
    this.user.username = 'user1';
    this.user.password = 'password1';
    return this;
  }

  build() {
    return { ...this.user };
  }
};
