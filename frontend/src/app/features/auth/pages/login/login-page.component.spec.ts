import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { ThemeService } from '../../../../core/services/theme.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let loginSpy: jasmine.Spy;
  let openSnackBarSpy: jasmine.Spy;
  let themeSignal: ReturnType<typeof signal<'light' | 'dark'>>;
  let toggleThemeSpy: jasmine.Spy;

  beforeEach(async () => {
    loginSpy = jasmine.createSpy('login').and.returnValue(Promise.resolve());
    openSnackBarSpy = jasmine.createSpy('open');
    themeSignal = signal<'light' | 'dark'>('light');
    toggleThemeSpy = jasmine.createSpy('toggleTheme').and.callFake(() => {
      themeSignal.set(themeSignal() === 'dark' ? 'light' : 'dark');
    });

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        {
          provide: Keycloak,
          useValue: {
            login: loginSpy
          }
        },
        {
          provide: Router,
          useValue: {
            createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue('/boats'),
            serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/boats')
          }
        },
        {
          provide: MatSnackBar,
          useValue: {
            open: openSnackBarSpy
          }
        },
        {
          provide: ThemeService,
          useValue: {
            theme: themeSignal,
            toggleTheme: toggleThemeSpy
          }
        }
      ]
    }).compileComponents();
  });

  it('renders the login page content', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.login-title')?.textContent).toContain('Sign in');
    expect(element.textContent).toContain('Access the management workspace.');
    expect(element.querySelector('.primary-action')?.textContent).toContain('Continue with Keycloak');
    expect(element.querySelector('.theme-toggle')?.textContent).toContain('Dark mode');
  });

  it('starts the login flow with the dashboard redirect uri', async () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(loginSpy).toHaveBeenCalledWith({
      redirectUri: `${window.location.origin}/boats`
    });
  });

  it('toggles the theme from the floating button', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.theme-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    expect(toggleThemeSpy).toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('.login-page')?.classList.contains('dark-mode')).toBeTrue();
    expect(toggle.textContent).toContain('Light mode');
  });

  it('shows a snackbar when login fails', async () => {
    loginSpy.and.returnValue(Promise.reject(new Error('boom')));

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement;
    button.click();

    await fixture.whenStable();

    expect(openSnackBarSpy).toHaveBeenCalledWith(
      'Unable to connect to the authentication server. Please try again.',
      'Close',
      { duration: 5000 }
    );
  });
});
