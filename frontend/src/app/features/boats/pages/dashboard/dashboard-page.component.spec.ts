import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatPaginator } from '@angular/material/paginator';
import { of, throwError } from 'rxjs';
import Keycloak from 'keycloak-js';

import { ThemeService } from '../../../../core/services/theme.service';
import { Boat, BoatMutationPayload, UUID } from '../../models/boat.model';
import { BoatDetailsDialogComponent } from '../../components/boat-details-dialog/boat-details-dialog.component';
import { BoatDeleteConfirmDialogComponent } from '../../components/boat-delete-confirm-dialog/boat-delete-confirm-dialog.component';
import { BoatFormDialogComponent } from '../../components/boat-form-dialog/boat-form-dialog.component';
import { BoatsService } from '../../services/boats.service';
import { DashboardPageComponent } from './dashboard-page.component';

function createDashboardComponent() {
  const fixture = TestBed.createComponent(DashboardPageComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component, element: fixture.nativeElement as HTMLElement };
}

function buildBoat(baseBoat: Boat, overrides: Partial<Boat> = {}): Boat {
  return {
    ...baseBoat,
    ...overrides
  };
}

function setSearchValue(element: HTMLElement, value: string): void {
  const searchInput = element.querySelector<HTMLInputElement>('.search-field input');
  searchInput!.value = value;
  searchInput!.dispatchEvent(new Event('input'));
}

describe('DashboardPageComponent', () => {
  const defaultBoat: Boat = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' as UUID,
    name: 'North Wind',
    description: 'Long range expedition yacht',
    createdBy: '7c9e6679-7425-40de-944b-e07fc1f90ae7' as UUID,
    createdAt: new Date('2026-04-12T08:30:00Z')
  };

  const boats: Boat[] = [defaultBoat];

  const pagedResponse = {
    content: [defaultBoat],
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
    const { element } = createDashboardComponent();

    expect(getBoatsSpy).toHaveBeenCalledWith(0, 10);
    expect(element.textContent).toContain('North Wind');
  });

  it('renders the configured dashboard columns without createdBy', () => {
    const { element } = createDashboardComponent();

    const headerCells = Array.from(
      element.querySelectorAll('th.mat-mdc-header-cell')
    ).map((cell) => cell.textContent?.trim());

    expect(headerCells).toEqual(['ID', 'Name', 'Description', 'Created at', 'Actions']);
    expect(headerCells).not.toContain('Created by');
  });

  it('renders a centered search input above the table', () => {
    const { element } = createDashboardComponent();
    const searchField = element.querySelector('.search-field input');

    expect(searchField).not.toBeNull();
    expect(searchField?.getAttribute('placeholder')).toBe('Search by name or description');
  });

  it('opens the details dialog when a table row is clicked', () => {
    const { component, element } = createDashboardComponent();
    const dialogOpenSpy = mockDialogOpen(component);

    const row = element.querySelector('tr.mat-mdc-row');
    row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialogOpenSpy).toHaveBeenCalledWith(BoatDetailsDialogComponent, {
      data: { boat: defaultBoat },
      panelClass: ['boat-dialog'],
      width: '640px',
      maxWidth: 'calc(100vw - 32px)'
    });
  });

  it('does not open the details dialog when clicking the update action', () => {
    const { component, element } = createDashboardComponent();
    const dialogOpenSpy = mockDialogOpen(component);

    const updateButton = element.querySelector<HTMLButtonElement>('button[aria-label="Update boat"]');
    updateButton?.click();

    expect(dialogOpenSpy).toHaveBeenCalledTimes(1);
    expect(dialogOpenSpy).toHaveBeenCalledWith(BoatFormDialogComponent, {
      data: {
        mode: 'update',
        boat: {
          name: defaultBoat.name,
          description: defaultBoat.description
        }
      },
      panelClass: ['boat-dialog'],
      width: '620px',
      maxWidth: 'calc(100vw - 32px)'
    });
  });

  it('renders truncation wrappers with full values in title attributes', () => {
    const { element } = createDashboardComponent();
    const idCell = element.querySelector('.id-cell');
    const nameCell = element.querySelector('.name-cell');
    const descriptionCell = element.querySelector('.description-cell');

    expect(idCell?.textContent?.trim()).toBe(defaultBoat.id);
    expect(idCell?.getAttribute('title')).toBe(defaultBoat.id);
    expect(nameCell?.textContent?.trim()).toBe(defaultBoat.name);
    expect(nameCell?.getAttribute('title')).toBe(defaultBoat.name);
    expect(descriptionCell?.textContent?.trim()).toBe(defaultBoat.description ?? undefined);
    expect(descriptionCell?.getAttribute('title')).toBe(defaultBoat.description ?? undefined);
  });

  it('renders the fallback description with truncation metadata when description is missing', () => {
    getBoatsSpy.and.returnValue(
      of({
        ...pagedResponse,
        content: [buildBoat(defaultBoat, { description: '' })]
      })
    );

    const { element } = createDashboardComponent();

    const descriptionCell = element.querySelector('.description-cell');

    expect(descriptionCell?.textContent?.trim()).toBe('No description');
    expect(descriptionCell?.getAttribute('title')).toBe('No description');
  });

  it('displays the username in the toolbar', () => {
    const { element } = createDashboardComponent();

    expect(element.textContent).toContain('dorian');
  });

  it('opens the create dialog and creates a boat when confirmed', () => {
    dialogResult = {
      name: 'Aurora',
      description: 'Survey vessel'
    } satisfies BoatMutationPayload;

    const { component } = createDashboardComponent();
    const dialogOpenSpy = mockDialogOpen(component);
    (component as any).openCreateDialog();

    expect(dialogOpenSpy).toHaveBeenCalledWith(BoatFormDialogComponent, {
      data: { mode: 'create' },
      panelClass: ['boat-dialog'],
      width: '620px',
      maxWidth: 'calc(100vw - 32px)'
    });
    expect(createBoatSpy).toHaveBeenCalledWith(dialogResult);
    expect(getBoatsSpy).toHaveBeenCalledTimes(2);
  });

  it('opens the update dialog and updates a boat when confirmed', () => {
    dialogResult = {
      name: 'North Wind II',
      description: 'Updated description'
    } satisfies BoatMutationPayload;

    const { component } = createDashboardComponent();
    const dialogOpenSpy = mockDialogOpen(component);
    (component as any).openUpdateDialog(defaultBoat);

    expect(dialogOpenSpy).toHaveBeenCalledWith(BoatFormDialogComponent, {
      data: {
        mode: 'update',
        boat: {
          name: defaultBoat.name,
          description: defaultBoat.description
        }
      },
      panelClass: ['boat-dialog'],
      width: '620px',
      maxWidth: 'calc(100vw - 32px)'
    });
    expect(updateBoatSpy).toHaveBeenCalledWith(defaultBoat.id, dialogResult);
    expect(getBoatsSpy).toHaveBeenCalledTimes(2);
  });

  it('opens the delete dialog and deletes a boat when confirmed', () => {
    dialogResult = true;

    const { component } = createDashboardComponent();
    const dialogOpenSpy = mockDialogOpen(component);
    (component as any).confirmDelete(defaultBoat);

    expect(dialogOpenSpy).toHaveBeenCalledWith(BoatDeleteConfirmDialogComponent, {
      data: { name: defaultBoat.name },
      panelClass: ['boat-dialog']
    });
    expect(deleteBoatSpy).toHaveBeenCalledWith(defaultBoat.id);
    expect(getBoatsSpy).toHaveBeenCalledTimes(2);
  });

  it('does not delete a boat when the confirmation dialog is cancelled', () => {
    dialogResult = false;

    const { component } = createDashboardComponent();
    mockDialogOpen(component);
    (component as any).confirmDelete(defaultBoat);

    expect(deleteBoatSpy).not.toHaveBeenCalled();
  });

  it('shows a red snackbar when update fails', () => {
    dialogResult = {
      name: 'North Wind II',
      description: null
    } satisfies BoatMutationPayload;
    updateBoatSpy.and.returnValue(throwError(() => new Error('boom')));

    const { component } = createDashboardComponent();
    mockDialogOpen(component);
    const snackBarOpenSpy = mockSnackBarOpen(component);
    (component as any).openUpdateDialog(defaultBoat);

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Unable to update boat. Please try again.', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  });

  it('shows a red snackbar when delete fails', () => {
    dialogResult = true;
    deleteBoatSpy.and.returnValue(throwError(() => new Error('boom')));

    const { component } = createDashboardComponent();
    mockDialogOpen(component);
    const snackBarOpenSpy = mockSnackBarOpen(component);
    (component as any).confirmDelete(defaultBoat);

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Unable to delete boat. Please try again.', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  });

  it('navigates to the previous page after deleting the last boat on a non-first page', () => {
    dialogResult = true;

    const { fixture, component } = createDashboardComponent();
    mockDialogOpen(component);

    // Simulate navigating to page 1 — currentPage becomes 1 via the tap
    const paginator = fixture.debugElement.query(By.directive(MatPaginator)).componentInstance as MatPaginator;
    paginator.page.emit({ pageIndex: 1, pageSize: 10, length: 11, previousPageIndex: 0 });
    fixture.detectChanges();

    // boats() still contains the single boat from pagedResponse, currentPage() is now 1
    (component as any).confirmDelete(defaultBoat);

    // Should reload page 0 (page - 1) because boats.length === 1 && currentPage > 0
    const lastCall = getBoatsSpy.calls.mostRecent().args;
    expect(lastCall).toEqual([0, 10]);
  });

  it('does not call the API when the create dialog is cancelled', () => {
    dialogResult = undefined;

    const { component } = createDashboardComponent();
    mockDialogOpen(component);
    (component as any).openCreateDialog();

    expect(createBoatSpy).not.toHaveBeenCalled();
  });

  it('does not call the API when the update dialog is cancelled', () => {
    dialogResult = undefined;

    const { component } = createDashboardComponent();
    mockDialogOpen(component);
    (component as any).openUpdateDialog(defaultBoat);

    expect(updateBoatSpy).not.toHaveBeenCalled();
  });

  it('hides the paginator when an error occurs', () => {
    getBoatsSpy.and.returnValue(throwError(() => new Error('boom')));

    const { element } = createDashboardComponent();

    const paginator = element.querySelector('mat-paginator');
    expect(paginator).toBeNull();
  });

  it('shows a red snackbar when create fails', () => {
    dialogResult = {
      name: 'Aurora',
      description: null
    } satisfies BoatMutationPayload;
    createBoatSpy.and.returnValue(throwError(() => new Error('boom')));

    const { component } = createDashboardComponent();
    mockDialogOpen(component);
    const snackBarOpenSpy = mockSnackBarOpen(component);
    (component as any).openCreateDialog();

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Unable to create boat. Please try again.', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  });

  it('requests a new page when the paginator changes', () => {
    const { fixture } = createDashboardComponent();

    const paginator = fixture.debugElement.query(By.directive(MatPaginator)).componentInstance as MatPaginator;
    paginator.page.emit({ pageIndex: 1, pageSize: 20, length: 1, previousPageIndex: 0 });
    fixture.detectChanges();

    expect(getBoatsSpy).toHaveBeenCalledWith(1, 20);
  });

  it('renders an error state when loading boats fails', () => {
    getBoatsSpy.and.returnValue(throwError(() => new Error('boom')));

    const { element } = createDashboardComponent();

    expect(element.textContent).toContain('Unable to load boats. Please try again.');
  });

  it('retries the current page when the retry button is clicked', () => {
    getBoatsSpy.and.returnValue(throwError(() => new Error('boom')));
    const { fixture, element } = createDashboardComponent();

    getBoatsSpy.and.returnValue(of(pagedResponse));
    const retryButton = element.querySelector<HTMLButtonElement>('.feedback-panel button');
    retryButton?.click();
    fixture.detectChanges();

    expect(getBoatsSpy).toHaveBeenCalledTimes(2);
    expect(element.textContent).toContain('North Wind');
  });

  it('renders the empty state when no boats are returned', () => {
    getBoatsSpy.and.returnValue(
      of({ ...pagedResponse, content: [], totalElements: 0, numberOfElements: 0, empty: true })
    );

    const { element } = createDashboardComponent();

    expect(element.textContent).toContain('No boats found');
  });

  it('filters boats by name', () => {
    const secondaryBoat = buildBoat(defaultBoat, {
      id: 'c56a4180-65aa-42ec-a945-5fd21dec0538' as UUID,
      name: 'Sea Mist',
      description: 'Harbor shuttle'
    });

    getBoatsSpy.and.returnValue(
      of({
        ...pagedResponse,
        content: [defaultBoat, secondaryBoat],
        totalElements: 2,
        numberOfElements: 2
      })
    );

    const { fixture, element } = createDashboardComponent();
    setSearchValue(element, 'north');
    fixture.detectChanges();

    const content = element.textContent ?? '';
    expect(content).toContain('North Wind');
    expect(content).not.toContain('Sea Mist');
  });

  it('filters boats by description and shows a search empty state when nothing matches', () => {
    const secondaryBoat = buildBoat(defaultBoat, {
      id: 'c56a4180-65aa-42ec-a945-5fd21dec0538' as UUID,
      name: 'Sea Mist',
      description: 'Harbor shuttle'
    });

    getBoatsSpy.and.returnValue(
      of({
        ...pagedResponse,
        content: [defaultBoat, secondaryBoat],
        totalElements: 2,
        numberOfElements: 2
      })
    );

    const { fixture, element } = createDashboardComponent();
    setSearchValue(element, 'shuttle');
    fixture.detectChanges();

    let content = element.textContent ?? '';
    expect(content).toContain('Sea Mist');
    expect(content).not.toContain('North Wind');

    setSearchValue(element, 'zzz');
    fixture.detectChanges();

    content = element.textContent ?? '';
    expect(content).toContain('No boats match your search.');
  });

  it('calls keycloak.logout with the login redirect URI', () => {
    const { element } = createDashboardComponent();

    const logoutButton = element.querySelector<HTMLButtonElement>('mat-toolbar button');
    logoutButton?.click();

    expect(logoutSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ redirectUri: jasmine.stringContaining('login') })
    );
  });

  it('toggles the theme when the theme button is clicked', () => {
    const { element } = createDashboardComponent();

    const themeButton = element.querySelector<HTMLButtonElement>('.theme-toggle');
    themeButton?.click();

    expect(toggleThemeSpy).toHaveBeenCalledTimes(1);
  });

  it('returns boat.id from trackBoat', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const result = (fixture.componentInstance as any).trackBoat(0, defaultBoat);
    expect(result).toBe(defaultBoat.id);
  });
});
