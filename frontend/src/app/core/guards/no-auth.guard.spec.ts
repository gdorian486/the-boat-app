import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthGuardData } from 'keycloak-angular';

import { APP_PATHS } from '../../app.routes.constants';
import { isUnauthenticatedOnly, noAuthGuard } from './no-auth.guard';

describe('noAuthGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
  });

  it('should be defined', () => {
    expect(noAuthGuard).toBeDefined();
  });
});

describe('isUnauthenticatedOnly', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
  });

  it('should return true when user is not authenticated', async () => {
    const authData = { authenticated: false } as AuthGuardData;

    const result = await TestBed.runInInjectionContext(() =>
      isUnauthenticatedOnly(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        authData
      )
    );

    expect(result).toBe(true);
  });

  it('should redirect to /boats when user is already authenticated', async () => {
    const authData = { authenticated: true } as AuthGuardData;

    const result = (await TestBed.runInInjectionContext(() =>
      isUnauthenticatedOnly(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        authData
      )
    )) as UrlTree;

    const expected = TestBed.inject(Router).parseUrl(`/${APP_PATHS.BOATS}`);
    expect(result.toString()).toBe(expected.toString());
  });
});

