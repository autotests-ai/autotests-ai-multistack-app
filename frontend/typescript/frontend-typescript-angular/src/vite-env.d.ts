/// <reference types="vite/client" />

import type { HeaderConfig } from './app/lib/header-config';

declare global {
  interface Window {
    headerConfig?: HeaderConfig;
  }
}

export {};
