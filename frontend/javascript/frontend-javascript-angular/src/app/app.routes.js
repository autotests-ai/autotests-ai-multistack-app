import { HomeComponent } from './pages/home.component.js';
import { LoginComponent } from './pages/login.component.js';
import { RegisterComponent } from './pages/register.component.js';

/**
 * Eagerly referenced components — no `loadComponent`. A single chunk keeps the
 * `assets/[name].js` filename contract that `index.html` pins during parse.
 */
export const routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
];
