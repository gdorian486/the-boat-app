import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import Keycloak from 'keycloak-js';

import { RUNTIME_CONFIG } from '../config/runtime-config.token';
import { authErrorRedirectInterceptor } from './auth-error-redirect.interceptor';

describe('authErrorRedirectInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;
  let keycloak: Pick<Keycloak, 'clearToken'>;

  beforeEach(() => {
    keycloak = {
      clearToken: jasmine.createSpy('clearToken')
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authErrorRedirectInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Keycloak,
          useValue: keycloak
        },
        {
          provide: RUNTIME_CONFIG,
          useValue: {
            keycloakUrl: 'http://localhost:8081',
            keycloakRealm: 'boat',
            keycloakClientId: 'boat-frontend',
            apiBaseUrl: 'http://localhost:8080/api'
          }
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('redirects to /login after a 401 from the API', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    httpClient.get('http://localhost:8080/api/boats').subscribe({
      error: () => undefined
    });

    httpMock.expectOne('http://localhost:8080/api/boats').flush(null, {
      status: 401,
      statusText: 'Unauthorized'
    });
    tick();

    expect(keycloak.clearToken).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));

  it('does not redirect for non-API 401 responses', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    httpClient.get('http://localhost:8081/realms/boat/account').subscribe({
      error: () => undefined
    });

    httpMock.expectOne('http://localhost:8081/realms/boat/account').flush(null, {
      status: 401,
      statusText: 'Unauthorized'
    });
    tick();

    expect(navigateSpy).not.toHaveBeenCalled();
  }));
});
