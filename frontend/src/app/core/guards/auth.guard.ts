import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthGuardData, createAuthGuard } from 'keycloak-angular';
import { APP_PATHS } from '../../app.routes.constants';

export const isAccessAllowed = async (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  if (authData.authenticated) {
    return true;
  }

  return inject(Router).parseUrl(`/${APP_PATHS.LOGIN}`);
};

export const authGuard = createAuthGuard(isAccessAllowed);
