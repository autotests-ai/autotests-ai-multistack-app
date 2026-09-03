const { faker } = require('@faker-js/faker');

function username() {
  return `user_${faker.string.alphanumeric(10).toLowerCase()}`;
}

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
exports.username = username;

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

  build() {
    return new User(this.username, this.password);
  }
};
