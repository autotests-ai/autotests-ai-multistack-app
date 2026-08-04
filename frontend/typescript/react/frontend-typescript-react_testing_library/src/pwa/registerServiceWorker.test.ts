import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from '../../../frontend-typescript-react/src/pwa/registerServiceWorker';

describe('registerServiceWorker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.stubEnv('DEV', true);
  });

  it('registers /sw.js immediately via DS primitive in production', async () => {
    vi.stubEnv('DEV', false);
    const update = vi.fn().mockResolvedValue(undefined);
    const register = vi.fn().mockResolvedValue({ update });
    const swAddEventListener = vi.fn();
    vi.stubGlobal('navigator', {
      serviceWorker: { register, addEventListener: swAddEventListener },
    });

    registerServiceWorker();

    expect(register).toHaveBeenCalledWith('/frontend-typescript-react/sw.js');
    expect(swAddEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function),
    );
    await Promise.resolve();
    expect(update).toHaveBeenCalled();
  });

  it('skips registration in Vite DEV', () => {
    vi.stubEnv('DEV', true);
    const register = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      serviceWorker: { register, addEventListener: vi.fn() },
    });

    registerServiceWorker();

    expect(register).not.toHaveBeenCalled();
  });

  it('skips registration when serviceWorker is unavailable', () => {
    vi.stubEnv('DEV', false);
    vi.stubGlobal('navigator', {});

    registerServiceWorker();
  });
});
