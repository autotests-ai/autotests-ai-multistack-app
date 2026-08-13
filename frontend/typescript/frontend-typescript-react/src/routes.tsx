import type { RouteObject } from 'react-router-dom';
import { App } from './App';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StackPage } from './pages/StackPage';

/**
 * Route objects rather than JSX `<Routes>`: the same array feeds
 * `createBrowserRouter` in `main.tsx` and `createMemoryRouter` in the tests, so
 * a route only ever has to be declared once.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'stack/*', element: <StackPage /> },
    ],
  },
];
