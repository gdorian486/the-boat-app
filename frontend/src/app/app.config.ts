import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  includeBearerTokenInterceptor,
  provideKeycloak
} from 'keycloak-angular';

import { routes } from './app.routes';
import { RuntimeConfig } from './core/config/runtime-config';
import { RUNTIME_CONFIG } from './core/config/runtime-config.token';
import { authErrorRedirectInterceptor } from './core/interceptors/auth-error-redirect.interceptor';

export function createAppConfig(runtimeConfig: RuntimeConfig): ApplicationConfig {
  const apiUrlCondition: IncludeBearerTokenCondition = {
    urlPattern: new RegExp(String.raw`^${escapeRegex(runtimeConfig.apiBaseUrl)}(/.*)?$`, 'i')
  };

  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideKeycloak({
        config: {
          url: runtimeConfig.keycloakUrl,
          realm: runtimeConfig.keycloakRealm,
          clientId: runtimeConfig.keycloakClientId
        },
        initOptions: {
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: `${globalThis.location.origin}/silent-check-sso.html`,
          redirectUri: globalThis.location.origin
        }
      }),
      {
        provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
        useValue: [apiUrlCondition]
      },
      {
        provide: RUNTIME_CONFIG,
        useValue: runtimeConfig
      },
      provideHttpClient(withFetch(), withInterceptors([authErrorRedirectInterceptor, includeBearerTokenInterceptor])),
      provideRouter(routes)
    ]
  };
}

function escapeRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
}
