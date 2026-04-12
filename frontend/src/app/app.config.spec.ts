import { INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG, IncludeBearerTokenCondition } from 'keycloak-angular';

import { createAppConfig } from './app.config';
import { RuntimeConfig } from './core/config/runtime-config';

describe('createAppConfig', () => {
  const runtimeConfig: RuntimeConfig = {
    keycloakUrl: 'http://localhost:8081',
    keycloakRealm: 'boat',
    keycloakClientId: 'boat-frontend',
    apiBaseUrl: 'http://localhost:8080/api.v1'
  };

  it('configures the bearer token condition for the API base url', () => {
    const appConfig = createAppConfig(runtimeConfig);
    const provider = (appConfig.providers as Array<{ provide?: unknown; useValue?: unknown }>).find(
      (item) => item?.provide === INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG
    );

    const conditions = provider?.useValue as IncludeBearerTokenCondition[];
    const condition = conditions[0];

    expect(condition.urlPattern.test('http://localhost:8080/api.v1')).toBeTrue();
    expect(condition.urlPattern.test('http://localhost:8080/api.v1/tasks')).toBeTrue();
    expect(condition.urlPattern.test('http://localhost:8080/apiXv1/tasks')).toBeFalse();
  });
});
