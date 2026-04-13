import { isRuntimeConfig, loadRuntimeConfig, RuntimeConfig } from './runtime-config';

describe('runtime-config', () => {
  const validConfig: RuntimeConfig = {
    keycloakUrl: 'http://localhost:8081',
    keycloakRealm: 'boat',
    keycloakClientId: 'boat-frontend',
    apiBaseUrl: 'http://localhost:8080'
  };

  beforeEach(() => {
    spyOn(globalThis, 'fetch');
  });

  it('isRuntimeConfig returns true for a complete config object', () => {
    expect(isRuntimeConfig(validConfig)).toBeTrue();
  });

  it('isRuntimeConfig returns false when a required field is missing or empty', () => {
    expect(
      isRuntimeConfig({
        ...validConfig,
        apiBaseUrl: ' '
      })
    ).toBeFalse();
  });

  it('loads the config from the first matching candidate url', async () => {
    (globalThis.fetch as jasmine.Spy).and.resolveTo({
      ok: true,
      json: () => Promise.resolve(validConfig)
    } as Response);

    await expectAsync(loadRuntimeConfig()).toBeResolvedTo(validConfig);
    expect(globalThis.fetch).toHaveBeenCalledWith('app-config.json');
  });

  it('falls back to the second candidate url when the first one is unavailable', async () => {
    (globalThis.fetch as jasmine.Spy)
      .withArgs('app-config.json')
      .and.resolveTo({ ok: false } as Response);
    (globalThis.fetch as jasmine.Spy)
      .withArgs('/app-config.json')
      .and.resolveTo({
        ok: true,
        json: () => Promise.resolve(validConfig)
      } as Response);

    await expectAsync(loadRuntimeConfig()).toBeResolvedTo(validConfig);
    expect(globalThis.fetch).toHaveBeenCalledWith('app-config.json');
    expect(globalThis.fetch).toHaveBeenCalledWith('/app-config.json');
  });

  it('throws when the runtime config json is invalid', async () => {
    (globalThis.fetch as jasmine.Spy).and.resolveTo({
      ok: true,
      json: () => Promise.reject(new Error('invalid json'))
    } as Response);

    await expectAsync(loadRuntimeConfig()).toBeRejectedWithError(
      'Failed to parse app runtime config from "app-config.json": invalid JSON'
    );
  });

  it('throws when the runtime config object is missing required fields', async () => {
    (globalThis.fetch as jasmine.Spy).and.resolveTo({
      ok: true,
      json: () =>
        Promise.resolve({
          ...validConfig,
          keycloakRealm: ''
        })
    } as Response);

    await expectAsync(loadRuntimeConfig()).toBeRejectedWithError(
      'Invalid app runtime config: missing or empty fields: keycloakRealm'
    );
  });

  it('throws when no runtime config file is found', async () => {
    (globalThis.fetch as jasmine.Spy).and.resolveTo({ ok: false } as Response);

    await expectAsync(loadRuntimeConfig()).toBeRejectedWithError(
      'Failed to load app runtime config: file not found at any of: app-config.json, /app-config.json'
    );
  });
});
