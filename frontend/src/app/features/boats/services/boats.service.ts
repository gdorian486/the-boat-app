import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, OperatorFunction, throwError } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config.token';
import { Boat, BoatMutationPayload, PagedResponse, UUID } from '../models/boat.model';
import { BOATS_API_PATHS } from '../constants/api-paths';
import { toUUID } from '../utils/uuid';


/** Shape of a boat as returned by the JSON API (dates as ISO strings, ids as plain strings). */
interface RawBoat {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class BoatsService {
  private readonly httpClient = inject(HttpClient);
  private readonly runtimeConfig = inject(RUNTIME_CONFIG);

  getBoats(page: number, size: number): Observable<PagedResponse<Boat>> {
    const params = new HttpParams({ fromObject: { page, size } });

    return this.httpClient
      .get<PagedResponse<RawBoat>>(`${this.runtimeConfig.apiBaseUrl}${BOATS_API_PATHS.boats}`, { params })
      .pipe(
        map(response => ({
          ...response,
          content: response.content.map((raw) => this.mapBoat(raw))
        })),
        this.handleError('getBoats')
      );
  }

  createBoat(payload: BoatMutationPayload): Observable<Boat> {
    return this.httpClient
      .post<RawBoat>(`${this.runtimeConfig.apiBaseUrl}${BOATS_API_PATHS.boats}`, payload)
      .pipe(
        map((raw) => this.mapBoat(raw)),
        this.handleError('createBoat')
      );
  }

  updateBoat(id: UUID, payload: BoatMutationPayload): Observable<Boat> {
    return this.httpClient
      .put<RawBoat>(`${this.runtimeConfig.apiBaseUrl}${BOATS_API_PATHS.boats}/${id}`, payload)
      .pipe(
        map((raw) => this.mapBoat(raw)),
        this.handleError('updateBoat')
      );
  }

  deleteBoat(id: UUID): Observable<void> {
    return this.httpClient
      .delete<void>(`${this.runtimeConfig.apiBaseUrl}${BOATS_API_PATHS.boats}/${id}`)
      .pipe(
        this.handleError('deleteBoat')
      );
  }

  private mapBoat(raw: RawBoat): Boat {
    const createdAt = new Date(raw.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new TypeError(`Invalid date received for boat ${raw.id}: "${raw.createdAt}"`);
    }

    return {
      ...raw,
      id: toUUID(raw.id),
      createdBy: toUUID(raw.createdBy),
      createdAt
    };
  }

  private handleError<T>(operation: string): OperatorFunction<T, T> {
    return catchError((err: unknown) => {
      console.error(`[BoatsService] ${operation} failed`, err);
      return throwError(() => err);
    });
  }
}
