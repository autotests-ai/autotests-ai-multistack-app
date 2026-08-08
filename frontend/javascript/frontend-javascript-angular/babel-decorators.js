import babel from '@rolldown/plugin-babel';

/**
 * Angular decorators from plain `.js`: Babel strips them to legacy `__decorate`
 * calls, which is exactly the shape `@angular/core` expects. The bundler cannot
 * parse decorator syntax, so this has to run before it, on every module under
 * `src/` — in the dev server, the production build and the Vitest pipeline alike.
 *
 * `@rolldown/plugin-babel` never reads `babel.config.*`, so the plugin list is
 * passed inline and this module is the single place both configs import it from.
 *
 * @returns {import('vite').PluginOption}
 */
export function angularDecorators() {
  return babel({
    include: /\/src\/.*\.js$/,
    exclude: /node_modules/,
    plugins: [
      ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
      ['@babel/plugin-transform-class-properties', { loose: true }],
    ],
  });
}
