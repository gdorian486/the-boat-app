import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatPaginator } from '@angular/material/paginator';
import { of, throwError } from 'rxjs';
import Keycloak from 'keycloak-js';

import { ThemeService } from '../../../../core/services/theme.service';
import { Boat, UUID } from '../../models/boat.model';
import { BoatsService } from '../../services/boats.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  const boats: Boat[] = [
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' as UUID,
      name: 'North Wind',
      description: 'Long range expedition yacht',
      createdBy: '7c9e6679-7425-40de-944b-e07fc1f90ae7' as UUID,
      createdAt: new Date('2026-04-12T08:30:00Z')
    }
  ];

  const pagedResponse = {
    content: boats,
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    numberOfElements: 1,
    first: true,
    last: true,
    empty: false
  };

  let getBoatsSpy: jasmine.Spy;
  let logoutSpy: jasmine.Spy;
  let themeSignal: ReturnType<typeof signal<'light' | 'dark'>>;
  let toggleThemeSpy: jasmine.Spy;

  beforeEach(async () => {
    getBoatsSpy = jasmine.createSpy('getBoats').and.returnValue(of(pagedResponse));
    logoutSpy = jasmine.createSpy('logout').and.returnValue(Promise.resolve());
    themeSignal = signal<'light' | 'dark'>('light');
    toggleThemeSpy = jasmine.createSpy('toggleTheme').and.callFake(() => {
      themeSignal.set(themeSignal() === 'dark' ? 'light' : 'dark');
    });

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        {
          provide: BoatsService,
          useValue: { getBoats: getBoatsSpy }
        },
        {
          provide: Keycloak,
          useValue: {
            tokenParsed: { preferred_username: 'dorian' },
            logout: logoutSpy
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

  it('loads the first boats page on init', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(getBoatsSpy).toHaveBeenCalledWith(0, 10);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('North Wind');
  });

  it('renders the configured dashboard columns without createdBy', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const headerCells = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('th.mat-mdc-header-cell')
    ).map((cell) => cell.textContent?.trim());

    expect(headerCells).toEqual(['ID', 'Name', 'Description', 'Created at']);
    expect(headerCells).not.toContain('Created by');
  });

  it('renders truncation wrappers with full values in title attributes', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const idCell = element.querySelector('.id-cell');
    const nameCell = element.querySelector('.name-cell');
    const descriptionCell = element.querySelector('.description-cell');

    expect(idCell?.textContent?.trim()).toBe(boats[0].id);
    expect(idCell?.getAttribute('title')).toBe(boats[0].id);
    expect(nameCell?.textContent?.trim()).toBe(boats[0].name);
    expect(nameCell?.getAttribute('title')).toBe(boats[0].name);
    expect(descriptionCell?.textContent?.trim()).toBe(boats[0].description ?? undefined);
    expect(descriptionCell?.getAttribute('title')).toBe(boats[0].description ?? undefined);
  });

  it('renders the fallback description with truncation metadata when description is missing', () => {
    getBoatsSpy.and.returnValue(
      of({
        ...pagedResponse,
        content: [{ ...boats[0], description: '' }]
      })
    );

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const descriptionCell = (fixture.nativeElement as HTMLElement).querySelector('.description-cell');

    expect(descriptionCell?.textContent?.trim()).toBe('No description');
    expect(descriptionCell?.getAttribute('title')).toBe('No description');
  });

  it('displays the username in the toolbar', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('dorian');
  });

  it('requests a new page when the paginator changes', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const paginator = fixture.debugElement.query(By.directive(MatPaginator)).componentInstance as MatPaginator;
    paginator.page.emit({ pageIndex: 1, pageSize: 20, length: 1, previousPageIndex: 0 });
    fixture.detectChanges();

    expect(getBoatsSpy).toHaveBeenCalledWith(1, 20);
  });

  it('renders an error state when loading boats fails', () => {
    getBoatsSpy.and.returnValue(throwError(() => new Error('boom')));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Unable to load boats. Please try again.'
    );
  });

  it('retries the current page when the retry button is clicked', () => {
    getBoatsSpy.and.returnValue(throwError(() => new Error('boom')));
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    getBoatsSpy.and.returnValue(of(pagedResponse));
    const retryButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.feedback-panel button'
    );
    retryButton?.click();
    fixture.detectChanges();

    expect(getBoatsSpy).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('North Wind');
  });

  it('renders the empty state when no boats are returned', () => {
    getBoatsSpy.and.returnValue(
      of({ ...pagedResponse, content: [], totalElements: 0, numberOfElements: 0, empty: true })
    );

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No boats found');
  });

  it('calls keycloak.logout with the login redirect URI', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const logoutButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'mat-toolbar button'
    );
    logoutButton?.click();

    expect(logoutSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ redirectUri: jasmine.stringContaining('login') })
    );
  });

  it('toggles the theme when the theme button is clicked', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const themeButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.theme-toggle'
    );
    themeButton?.click();

    expect(toggleThemeSpy).toHaveBeenCalledTimes(1);
  });

  it('returns boat.id from trackBoat', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const result = (fixture.componentInstance as any).trackBoat(0, boats[0]);
    expect(result).toBe(boats[0].id);
  });
});
