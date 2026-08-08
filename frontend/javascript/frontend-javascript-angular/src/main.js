// JIT first: `@angular/compiler` publishes the compiler facade that `@angular/core`
// picks up when it compiles `@Component` metadata at runtime. Babel cannot run the
// AOT compiler, so this import is what makes plain `.js` components work at all —
// see README, "Angular without TypeScript".
import '@angular/compiler';
import { APP_BASE_HREF } from '@angular/common';
import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component.js';
import { routes } from './app/app.routes.js';
import { APP_BASE } from './app/lib/app-base.js';
import './styles.js';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // No zone.js: component state is signals, which notify change detection
    // directly. See README, "Signals, not zone.js".
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Path matrix: the router lives under /{backend}/{frontend}/, so deep links
    // like /frontend-javascript-angular/login resolve (nginx try_files → index.html).
    { provide: APP_BASE_HREF, useValue: `${APP_BASE}/` },
  ],
});
