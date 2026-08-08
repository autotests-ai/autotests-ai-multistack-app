import type { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home.component';
import { LoginPageComponent } from './pages/login.component';
import { RegisterPageComponent } from './pages/register.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
];
