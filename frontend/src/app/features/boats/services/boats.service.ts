import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config.token';
import { Boat, PagedResponse } from '../models/boat.model';
import { BOATS_API_PATHS } from '../constants/api-paths';
import { toUUID } from '../utils/uuid';

export type { Boat, PagedResponse, UUID } from '../models/boat.model';

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
          content: response.content.map(raw => ({
            ...raw,
            id: toUUID(raw.id),
            createdBy: toUUID(raw.createdBy),
            createdAt: new Date(raw.createdAt)
          }))
        })),
        catchError(err => {
          console.error('[BoatsService] getBoats failed', err);
          return throwError(() => err);
        })
      );
  }
}
