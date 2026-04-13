import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatPaginator } from '@angular/material/paginator';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import Keycloak from 'keycloak-js';

import { ThemeService } from '../../../../core/services/theme.service';
import { Boat, BoatMutationPayload, UUID } from '../../models/boat.model';
import { BoatDeleteConfirmDialogComponent } from '../../components/boat-delete-confirm-dialog/boat-delete-confirm-dialog.component';
import { BoatFormDialogComponent } from '../../components/boat-form-dialog/boat-form-dialog.component';
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
  let createBoatSpy: jasmine.Spy;
  let updateBoatSpy: jasmine.Spy;
  let deleteBoatSpy: jasmine.Spy;
  let logoutSpy: jasmine.Spy;
  let themeSignal: ReturnType<typeof signal<'light' | 'dark'>>;
  let toggleThemeSpy: jasmine.Spy;
  let dialogResult: unknown;

  beforeEach(async () => {
    getBoatsSpy = jasmine.createSpy('getBoats').and.returnValue(of(pagedResponse));
    createBoatSpy = jasmine.createSpy('createBoat').and.returnValue(of(boats[0]));
    updateBoatSpy = jasmine.createSpy('updateBoat').and.returnValue(of(boats[0]));
    deleteBoatSpy = jasmine.createSpy('deleteBoat').and.returnValue(of(void 0));
    logoutSpy = jasmine.createSpy('logout').and.returnValue(Promise.resolve());
    dialogResult = undefined;
    themeSignal = signal<'light' | 'dark'>('light');
    toggleThemeSpy = jasmine.createSpy('toggleTheme').and.callFake(() => {
      themeSignal.set(themeSignal() === 'dark' ? 'light' : 'dark');
    });

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: BoatsService,
          useValue: {
            getBoats: getBoatsSpy,
            createBoat: createBoatSpy,
            updateBoat: updateBoatSpy,
            deleteBoat: deleteBoatSpy
          }
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

  function mockDialogOpen(component: DashboardPageComponent): jasmine.Spy {
    return spyOn((component as any).dialog, 'open').and.callFake(() => ({
      afterClosed: () => of(dialogResult)
    }) as never);
  }

  function mockSnackBarOpen(component: DashboardPageComponent): jasmine.Spy {
    return spyOn((component as any).snackBar, 'open');
  }

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

    expect(headerCells).toEqual(['ID', 'Name', 'Description', 'Created at', 'Actions']);
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

  it('opens the create dialog and creates a boat when confirmed', () => {
    dialogResult = {
      name: 'Aurora',
      description: 'Survey vessel'
    } satisfies BoatMutationPayload;

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    const dialogOpenSpy = mockDialogOpen(component);
    fixture.detectChanges();
    (component as any).openCreateDialog();

    expect(dialogOpenSpy).toHaveBeenCalledWith(BoatFormDialogComponent, {
      data: { mode: 'create' },
      panelClass: ['boat-dialog']
    });
    expect(createBoatSpy).toHaveBeenCalledWith(dialogResult);
    expect(getBoatsSpy).toHaveBeenCalledTimes(2);
  });

  it('opens the update dialog and updates a boat when confirmed', () => {
    dialogResult = {
      name: 'North Wind II',
      description: 'Updated description'
    } satisfies BoatMutationPayload;

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    const dialogOpenSpy = mockDialogOpen(component);
    fixture.detectChanges();
    (component as any).openUpdateDialog(boats[0]);

    expect(dialogOpenSpy).toHaveBeenCalledWith(BoatFormDialogComponent, {
      data: {
        mode: 'update',
        boat: {
          name: boats[0].name,
          description: boats[0].description
        }
      },
      panelClass: ['boat-dialog']
    });
    expect(updateBoatSpy).toHaveBeenCalledWith(boats[0].id, dialogResult);
    expect(getBoatsSpy).toHaveBeenCalledTimes(2);
  });

  it('opens the delete dialog and deletes a boat when confirmed', () => {
    dialogResult = true;

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    const dialogOpenSpy = mockDialogOpen(component);
    fixture.detectChanges();
    (component as any).confirmDelete(boats[0]);

    expect(dialogOpenSpy).toHaveBeenCalledWith(BoatDeleteConfirmDialogComponent, {
      data: { name: boats[0].name },
      panelClass: ['boat-dialog']
    });
    expect(deleteBoatSpy).toHaveBeenCalledWith(boats[0].id);
    expect(getBoatsSpy).toHaveBeenCalledTimes(2);
  });

  it('does not delete a boat when the confirmation dialog is cancelled', () => {
    dialogResult = false;

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    mockDialogOpen(component);
    fixture.detectChanges();
    (component as any).confirmDelete(boats[0]);

    expect(deleteBoatSpy).not.toHaveBeenCalled();
  });

  it('shows a red snackbar when update fails', () => {
    dialogResult = {
      name: 'North Wind II',
      description: null
    } satisfies BoatMutationPayload;
    updateBoatSpy.and.returnValue(throwError(() => new Error('boom')));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    mockDialogOpen(component);
    const snackBarOpenSpy = mockSnackBarOpen(component);
    fixture.detectChanges();
    (component as any).openUpdateDialog(boats[0]);

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Unable to update boat. Please try again.', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  });

  it('shows a red snackbar when delete fails', () => {
    dialogResult = true;
    deleteBoatSpy.and.returnValue(throwError(() => new Error('boom')));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    mockDialogOpen(component);
    const snackBarOpenSpy = mockSnackBarOpen(component);
    fixture.detectChanges();
    (component as any).confirmDelete(boats[0]);

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Unable to delete boat. Please try again.', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  });

  it('navigates to the previous page after deleting the last boat on a non-first page', () => {
    dialogResult = true;

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    mockDialogOpen(component);
    fixture.detectChanges();

    // Simulate navigating to page 1 — currentPage becomes 1 via the tap
    const paginator = fixture.debugElement.query(By.directive(MatPaginator)).componentInstance as MatPaginator;
    paginator.page.emit({ pageIndex: 1, pageSize: 10, length: 11, previousPageIndex: 0 });
    fixture.detectChanges();

    // boats() still contains the single boat from pagedResponse, currentPage() is now 1
    (component as any).confirmDelete(boats[0]);

    // Should reload page 0 (page - 1) because boats.length === 1 && currentPage > 0
    const lastCall = getBoatsSpy.calls.mostRecent().args;
    expect(lastCall).toEqual([0, 10]);
  });

  it('does not call the API when the create dialog is cancelled', () => {
    dialogResult = undefined;

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    mockDialogOpen(component);
    fixture.detectChanges();
    (component as any).openCreateDialog();

    expect(createBoatSpy).not.toHaveBeenCalled();
  });

  it('does not call the API when the update dialog is cancelled', () => {
    dialogResult = undefined;

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    mockDialogOpen(component);
    fixture.detectChanges();
    (component as any).openUpdateDialog(boats[0]);

    expect(updateBoatSpy).not.toHaveBeenCalled();
  });

  it('hides the paginator when an error occurs', () => {
    getBoatsSpy.and.returnValue(throwError(() => new Error('boom')));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const paginator = (fixture.nativeElement as HTMLElement).querySelector('mat-paginator');
    expect(paginator).toBeNull();
  });

  it('shows a red snackbar when create fails', () => {
    dialogResult = {
      name: 'Aurora',
      description: null
    } satisfies BoatMutationPayload;
    createBoatSpy.and.returnValue(throwError(() => new Error('boom')));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    mockDialogOpen(component);
    const snackBarOpenSpy = mockSnackBarOpen(component);
    fixture.detectChanges();
    (component as any).openCreateDialog();

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Unable to create boat. Please try again.', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
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
