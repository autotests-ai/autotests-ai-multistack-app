import { APP_BASE_HREF } from '@angular/common';
import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { APP_BASE } from './app/lib/app-base';
import './styles';

/**
 * `APP_BASE_HREF` is the product mount resolved from the path matrix, so
 * `router.navigate(['/login'])` lands on `/{backend}/{frontend}/login` and a deep
 * link there resolves back to the `/login` route (nginx try_files → index.html).
 */
bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: APP_BASE_HREF, useValue: `${APP_BASE}/` },
  ],
}).catch((error: unknown) => {
  console.error(error);
});
