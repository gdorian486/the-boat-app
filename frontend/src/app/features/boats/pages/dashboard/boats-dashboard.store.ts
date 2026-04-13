import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, Observable, startWith, Subject, switchMap, tap } from 'rxjs';

import { Boat, BoatMutationPayload, PagedResponse, UUID } from '../../models/boat.model';
import { BoatsService } from '../../services/boats.service';

/**
 * Component-scoped store for the dashboard page.
 * Owns all boat list state (signals) and coordinates data loading.
 * Must be provided in the component's `providers` array.
 */
@Injectable()
export class BoatsDashboardStore {
  private readonly boatsService = inject(BoatsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly paginationRequests = new Subject<{ page: number; size: number }>();

  readonly boats = signal<Boat[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly currentPageSize = signal(10);
  readonly pageSizeOptions = [10, 20, 50, 100] as const;

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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  loadPage(page: number, size: number): void {
    this.paginationRequests.next({ page, size });
  }

  reload(): void {
    this.loadPage(this.currentPage(), this.currentPageSize());
  }

  create(payload: BoatMutationPayload): Observable<Boat> {
    return this.boatsService.createBoat(payload).pipe(
      tap(() => this.reload())
    );
  }

  update(id: UUID, payload: BoatMutationPayload): Observable<Boat> {
    return this.boatsService.updateBoat(id, payload).pipe(
      tap(() => this.reload())
    );
  }

  delete(id: UUID): Observable<void> {
    return this.boatsService.deleteBoat(id).pipe(
      tap(() => this.loadPage(this.pageAfterDelete(), this.currentPageSize()))
    );
  }

  private pageAfterDelete(): number {
    return this.boats().length === 1 && this.currentPage() > 0
      ? this.currentPage() - 1
      : this.currentPage();
  }

  private applyResponse(response: PagedResponse<Boat>): void {
    this.boats.set(response.content);
    this.totalElements.set(response.totalElements);
    this.isLoading.set(false);
  }
}

