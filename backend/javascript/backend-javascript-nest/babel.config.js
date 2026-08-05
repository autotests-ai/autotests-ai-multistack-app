'use strict';

// Nest needs decorator metadata; V8 has no decorators yet, so plain-JS sources
// are compiled with Babel's legacy decorators (the same semantics Nest's TS
// setup relies on). DI uses explicit @Inject tokens because JavaScript emits no
// design:paramtypes.
module.exports = {
  targets: { node: '22' },
  presets: [['@babel/preset-env', { targets: { node: '22' } }]],
  plugins: [
    ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
  ],
};
