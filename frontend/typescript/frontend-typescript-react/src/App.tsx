import { AppHeader } from '@zero-design-system/react';
import { Route, Routes } from 'react-router-dom';
import { appPath } from './lib/appBase';
import { headerConfig } from './lib/headerConfig';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StackPage } from './pages/StackPage';

export function App() {
  return (
    <>
      <AppHeader config={headerConfig} scriptSrc={appPath('/js/header.js')} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/stack" element={<StackPage />} />
        <Route path="/stack/" element={<StackPage />} />
      </Routes>
    </>
  );
}
