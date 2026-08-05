'use strict';

const { Inject } = require('@nestjs/common');

// Babel compiles class and method decorators, but parameter decorators are a
// TypeScript-only syntax with no JavaScript equivalent. Nest decorators are
// plain functions, so plain-JS modules attach the same metadata by calling them
// directly — `injectConstructor(Foo, TOKEN)` is exactly what `constructor(
// @Inject(TOKEN) bar)` would emit. Explicit tokens are required either way,
// because JavaScript never emits `design:paramtypes`.

function injectConstructor(target, ...tokens) {
  tokens.forEach((token, index) => Inject(token)(target, undefined, index));
}

function decorateParams(target, methodName, ...decorators) {
  decorators.forEach((decorator, index) =>
    decorator(target.prototype, methodName, index)
  );
}

module.exports = { injectConstructor, decorateParams };
