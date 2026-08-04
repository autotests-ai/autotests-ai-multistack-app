export function registerServiceWorker(options?: {
  swUrl?: string;
  immediate?: boolean;
  reloadOnControllerChange?: boolean;
  onRegistered?: (reg: ServiceWorkerRegistration) => void;
  onRegisterError?: (err: unknown) => void;
}): void;
