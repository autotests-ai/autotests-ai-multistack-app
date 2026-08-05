'use strict';

// JavaScript emits no design:paramtypes, so every injection point names its
// provider through one of these tokens.
const STORE = Symbol('STORE');
const SETTINGS = Symbol('SETTINGS');

module.exports = { STORE, SETTINGS };
