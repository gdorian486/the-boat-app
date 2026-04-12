import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ThemeService } from '../../core/services/theme.service';
import { APP_PATHS } from '../../app.routes.constants';
import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  it('renders the 404 content and dashboard link', async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ThemeService,
          useValue: {
            theme: signal<'light' | 'dark'>('light')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const action = element.querySelector('button');

    expect(element.querySelector('h1')?.textContent).toContain('404');
    expect(element.textContent).toContain('This page does not exist.');
    expect(action?.textContent).toContain('Back to dashboard');
  });

  it('applies dark mode class when the theme is dark', async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ThemeService,
          useValue: {
            theme: signal<'light' | 'dark'>('dark')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.not-found')?.classList.contains('dark-mode')).toBeTrue();
  });

  it('links back to the dashboard route', async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ThemeService,
          useValue: {
            theme: signal<'light' | 'dark'>('light')
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();

    const routerLink = fixture.debugElement.query(By.directive(RouterLink)).injector.get(RouterLink);
    expect(routerLink.urlTree?.toString()).toBe(`/${APP_PATHS.BOATS}`);
  });
});
