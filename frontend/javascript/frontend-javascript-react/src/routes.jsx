import { App } from './App';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * Route objects rather than JSX `<Routes>`: the same array feeds
 * `createBrowserRouter` in `main.jsx` and `createMemoryRouter` in the tests, so
 * a route only ever has to be declared once.
 *
 * @type {import('react-router-dom').RouteObject[]}
 */
export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
];
