import { DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import Keycloak from 'keycloak-js';
import { catchError, EMPTY, filter, switchMap, take } from 'rxjs';

import { APP_PATHS } from '../../../../app.routes.constants';
import { ThemeService } from '../../../../core/services/theme.service';
import { Boat, BoatMutationPayload } from '../../models/boat.model';
import { BoatDetailsDialogComponent } from '../../components/boat-details-dialog/boat-details-dialog.component';
import { BoatDeleteConfirmDialogComponent } from '../../components/boat-delete-confirm-dialog/boat-delete-confirm-dialog.component';
import { BoatFormDialogComponent } from '../../components/boat-form-dialog/boat-form-dialog.component';
import { BoatsDashboardStore } from './boats-dashboard.store';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatToolbarModule
  ],
  providers: [BoatsDashboardStore],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  protected readonly store = inject(BoatsDashboardStore);

  private readonly keycloak = inject(Keycloak);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly themeService = inject(ThemeService);

  protected readonly theme = this.themeService.theme;
  protected readonly toggleTheme = () => this.themeService.toggleTheme();
  protected readonly username: string = this.keycloak.tokenParsed?.['preferred_username'] ?? '';
  protected readonly displayedColumns = ['id', 'name', 'description', 'createdAt', 'actions'];

  protected logout(): void {
    this.keycloak.logout({
      redirectUri: `${this.document.location.origin}/${APP_PATHS.LOGIN}`
    }).catch((err: unknown) => {
      console.error('Logout failed', err);
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.store.loadPage(event.pageIndex, event.pageSize);
  }

  protected trackBoat(_index: number, boat: Boat): string {
    return boat.id;
  }

  protected openDetailsDialog(boat: Boat): void {
    this.dialog.open(BoatDetailsDialogComponent, {
      data: { boat },
      panelClass: ['boat-dialog'],
      width: '640px',
      maxWidth: 'calc(100vw - 32px)'
    });
  }

  protected openCreateDialog(): void {
    this.dialog
      .open(BoatFormDialogComponent, {
        data: { mode: 'create' },
        panelClass: ['boat-dialog'],
        width: '620px',
        maxWidth: 'calc(100vw - 32px)'
      })
      .afterClosed()
      .pipe(
        take(1),
        filter((payload): payload is BoatMutationPayload => payload !== undefined),
        switchMap((payload) =>
          this.store.create(payload).pipe(
            catchError(() => {
              this.showMutationError('Unable to create boat. Please try again.');
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected openUpdateDialog(boat: Boat): void {
    this.dialog
      .open(BoatFormDialogComponent, {
        data: {
          mode: 'update',
          boat: { name: boat.name, description: boat.description }
        },
        panelClass: ['boat-dialog'],
        width: '620px',
        maxWidth: 'calc(100vw - 32px)'
      })
      .afterClosed()
      .pipe(
        take(1),
        filter((payload): payload is BoatMutationPayload => payload !== undefined),
        switchMap((payload) =>
          this.store.update(boat.id, payload).pipe(
            catchError(() => {
              this.showMutationError('Unable to update boat. Please try again.');
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected confirmDelete(boat: Boat): void {
    this.dialog
      .open(BoatDeleteConfirmDialogComponent, {
        data: { name: boat.name },
        panelClass: ['boat-dialog']
      })
      .afterClosed()
      .pipe(
        take(1),
        filter((confirmed): confirmed is true => confirmed === true),
        switchMap(() =>
          this.store.delete(boat.id).pipe(
            catchError(() => {
              this.showMutationError('Unable to delete boat. Please try again.');
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private showMutationError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
