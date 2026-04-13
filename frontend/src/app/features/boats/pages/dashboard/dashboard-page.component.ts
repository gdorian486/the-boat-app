import { DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import Keycloak from 'keycloak-js';
import { catchError, EMPTY, startWith, Subject, switchMap, tap } from 'rxjs';

import { APP_PATHS } from '../../../../app.routes.constants';
import { ThemeService } from '../../../../core/services/theme.service';
import { Boat, PagedResponse } from '../../models/boat.model';
import { BoatsService } from '../../services/boats.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatToolbarModule
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly boatsService = inject(BoatsService);
  private readonly keycloak = inject(Keycloak);
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);
  private readonly paginationRequests = new Subject<{ page: number; size: number }>();

  protected readonly theme = this.themeService.theme;
  protected readonly toggleTheme = () => this.themeService.toggleTheme();
  protected readonly username: string = this.keycloak.tokenParsed?.['preferred_username'] ?? '';
  protected readonly displayedColumns = ['id', 'name', 'description', 'createdAt'];
  protected readonly pageSizeOptions = [10, 20, 50, 100];
  protected readonly boats = signal<Boat[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly totalElements = signal(0);
  protected readonly currentPage = signal(0);
  protected readonly currentPageSize = signal(10);

  constructor() {
    this.paginationRequests
      .pipe(
        startWith({ page: this.currentPage(), size: this.currentPageSize() }),
        tap(({ page, size }) => {
          this.currentPage.set(page);
          this.currentPageSize.set(size);
          this.isLoading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap(({ page, size }) =>
          this.boatsService.getBoats(page, size).pipe(
            tap((response) => this.applyResponse(response)),
            catchError(() => {
              this.boats.set([]);
              this.totalElements.set(0);
              this.errorMessage.set('Unable to load boats. Please try again.');
              this.isLoading.set(false);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe();
  }


  protected logout(): void {
    this.keycloak.logout({
      redirectUri: `${this.document.location.origin}/${APP_PATHS.LOGIN}`
    }).catch((err: unknown) => {
      console.error('Logout failed', err);
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.paginationRequests.next({
      page: event.pageIndex,
      size: event.pageSize
    });
  }

  protected retry(): void {
    this.paginationRequests.next({
      page: this.currentPage(),
      size: this.currentPageSize()
    });
  }

  protected trackBoat(_index: number, boat: Boat): string {
    return boat.id;
  }

  private applyResponse(response: PagedResponse<Boat>): void {
    this.boats.set(response.content);
    this.totalElements.set(response.totalElements);
    this.currentPage.set(response.page);
    this.currentPageSize.set(response.size);
    this.isLoading.set(false);
  }
}
