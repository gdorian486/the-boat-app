import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthGuardData } from 'keycloak-angular';

import { APP_PATHS } from '../../app.routes.constants';
import { authGuard, isAccessAllowed } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });
});

describe('isAccessAllowed', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
  });

  it('should return true when user is authenticated', async () => {
    const authData = { authenticated: true } as AuthGuardData;

    const result = await TestBed.runInInjectionContext(() =>
      isAccessAllowed(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        authData
      )
    );

    expect(result).toBe(true);
  });

  it(`should redirect to /${APP_PATHS.LOGIN} when user is not authenticated`, async () => {
    const authData = { authenticated: false } as AuthGuardData;

    const result = (await TestBed.runInInjectionContext(() =>
      isAccessAllowed(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        authData
      )
    )) as UrlTree;

    const expected = TestBed.inject(Router).parseUrl(`/${APP_PATHS.LOGIN}`);
    expect(result.toString()).toBe(expected.toString());
  });
});
