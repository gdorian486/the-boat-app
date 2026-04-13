import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import Keycloak from 'keycloak-js';
import { routes } from './app.routes';

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
class TestHostComponent {}

async function configureRoutes(authenticated = false): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [TestHostComponent],
    providers: [
      provideRouter(routes),
      {
        provide: Keycloak,
        useValue: {
          authenticated,
          login: jasmine.createSpy('login').and.returnValue(Promise.resolve())
        }
      },
      {
        provide: MatSnackBar,
        useValue: {
          open: jasmine.createSpy('open')
        }
      }
    ]
  }).compileComponents();
}

describe('app routes', () => {
  it('renders the login page for /login', async () => {
    await configureRoutes(false);

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');

    expect(TestBed.inject(Router).url).toBe('/login');
    expect(harness.routeNativeElement?.textContent).toContain('Sign in');
    expect(harness.routeNativeElement?.textContent).toContain('Continue with Keycloak');
  });

  it('renders the not found page for an unknown url', async () => {
    await configureRoutes(false);

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/missing-page');

    expect(TestBed.inject(Router).url).toBe('/missing-page');
    expect(harness.routeNativeElement?.textContent).toContain('This page does not exist.');
    expect(harness.routeNativeElement?.textContent).toContain('Back to dashboard');
  });
});
