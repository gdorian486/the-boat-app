import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { catchError, throwError } from 'rxjs';

import { APP_PATHS } from '../../app.routes.constants';
import { RUNTIME_CONFIG } from '../config/runtime-config.token';

export const authErrorRedirectInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const runtimeConfig = inject(RUNTIME_CONFIG);
  const keycloak = inject(Keycloak);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (shouldRedirectToLogin(error, req.url, runtimeConfig.apiBaseUrl, router.url)) {
        keycloak.clearToken();
        void router.navigate([`/${APP_PATHS.LOGIN}`]);
      }

      return throwError(() => error);
    })
  );
};

function shouldRedirectToLogin(
  error: unknown,
  requestUrl: string,
  apiBaseUrl: string,
  currentUrl: string
): boolean {
  if (currentUrl === `/${APP_PATHS.LOGIN}`) return false;
  if (!isApiRequest(requestUrl, apiBaseUrl)) return false;

  return isHttpUnauthorized(error) || isTokenRefreshFailure(error);
}

function isHttpUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function isTokenRefreshFailure(error: unknown): boolean {
  return !(error instanceof HttpErrorResponse);
}

function isApiRequest(requestUrl: string, apiBaseUrl: string): boolean {
  return requestUrl === apiBaseUrl || requestUrl.startsWith(`${apiBaseUrl}/`);
}
