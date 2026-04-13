import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config.token';
import { Boat, BoatMutationPayload, PagedResponse, UUID } from '../models/boat.model';
import { BoatsService } from './boats.service';

interface RawBoatResponse {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

const MOCK_RUNTIME_CONFIG = {
  keycloakUrl: 'http://localhost:8081',
  keycloakRealm: 'boat',
  keycloakClientId: 'boat-frontend',
  apiBaseUrl: 'http://localhost:8080'
};

const BOAT_ID = '123e4567-e89b-12d3-a456-426614174000' as UUID;
const CREATOR_ID = '123e4567-e89b-12d3-a456-426614174001' as UUID;
const BOAT_URL = 'http://localhost:8080/api/boats';
const DEFAULT_RAW_BOAT: RawBoatResponse = {
  id: BOAT_ID,
  name: 'Titanic',
  description: null,
  createdBy: CREATOR_ID,
  createdAt: '2024-01-15T10:30:00Z'
};

function createPagedResponse(overrides: Partial<PagedResponse<unknown>> = {}) {
  return {
    content: [],
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    numberOfElements: 1,
    first: true,
    last: true,
    empty: false,
    ...overrides
  };
}

function createRawBoat(overrides: Partial<RawBoatResponse> = {}): RawBoatResponse {
  return {
    ...DEFAULT_RAW_BOAT,
    ...overrides
  };
}

function expectBoatsGet(httpTestingController: HttpTestingController, page: number, size: number) {
  return httpTestingController.expectOne(
    (req) =>
      req.method === 'GET' &&
      req.url === BOAT_URL &&
      req.params.get('page') === `${page}` &&
      req.params.get('size') === `${size}`
  );
}

describe('BoatsService', () => {
  let service: BoatsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BoatsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RUNTIME_CONFIG, useValue: MOCK_RUNTIME_CONFIG }
      ]
    });

    service = TestBed.inject(BoatsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('getBoats', () => {
    it('sends a GET request to the boats endpoint with the correct page and size params', () => {
      service.getBoats(2, 50).subscribe();

      const request = expectBoatsGet(httpTestingController, 2, 50);

      expect(request.request.method).toBe('GET');

      request.flush(createPagedResponse({
        page: 2,
        size: 50,
        totalElements: 100,
        totalPages: 2,
        numberOfElements: 0,
        first: false,
        last: true,
        empty: true
      }));
    });

    it('maps createdAt ISO string to a Date object', () => {
      let result: PagedResponse<Boat> | undefined;

      service.getBoats(0, 10).subscribe((r) => (result = r));

      expectBoatsGet(httpTestingController, 0, 10).flush(createPagedResponse({
        content: [createRawBoat()]
      }));

      const boat = result!.content[0];
      expect(boat.createdAt).toBeInstanceOf(Date);
      expect(boat.createdAt.getFullYear()).toBe(2024);
      expect(boat.createdAt.getMonth()).toBe(0); // janvier
      expect(boat.createdAt.getDate()).toBe(15);
    });

    it('preserves null description', () => {
      let result: PagedResponse<Boat> | undefined;

      service.getBoats(0, 10).subscribe((r) => (result = r));

      expectBoatsGet(httpTestingController, 0, 10).flush(createPagedResponse({
        content: [createRawBoat()]
      }));

      expect(result!.content[0].description).toBeNull();
    });

    it('throws an error when the API returns a non-UUID id', () => {
      let error: unknown;

      service.getBoats(0, 10).subscribe({ error: (e) => (error = e) });

      expectBoatsGet(httpTestingController, 0, 10).flush(createPagedResponse({
        content: [createRawBoat({ id: 'not-a-uuid', name: 'Ghost Ship' })]
      }));

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('not-a-uuid');
    });

    it('throws an error when the API returns a malformed date', () => {
      let error: unknown;

      service.getBoats(0, 10).subscribe({ error: (e) => (error = e) });

      expectBoatsGet(httpTestingController, 0, 10).flush(createPagedResponse({
        content: [createRawBoat({ name: 'Ghost Ship', createdAt: 'not-a-date' })]
      }));

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('not-a-date');
    });

    it('propagates HTTP errors', () => {
      let error: unknown;

      service.getBoats(0, 10).subscribe({ error: (e) => (error = e) });

      expectBoatsGet(httpTestingController, 0, 10).flush(
        'Server error',
        { status: 500, statusText: 'Internal Server Error' }
      );

      expect(error).toBeTruthy();
    });
  });

  describe('createBoat', () => {
    it('sends a POST request to the boats endpoint', () => {
      const payload: BoatMutationPayload = {
        name: 'Aurora',
        description: 'Fast response vessel'
      };

      service.createBoat(payload).subscribe();

      const request = httpTestingController.expectOne(BOAT_URL);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(payload);

      request.flush(createRawBoat({
        name: payload.name,
        description: payload.description
      }));
    });

    it('maps the created boat response', () => {
      let result: Boat | undefined;

      service.createBoat({ name: 'Aurora', description: null }).subscribe((boat) => (result = boat));

      httpTestingController.expectOne(BOAT_URL).flush(createRawBoat({
        name: 'Aurora'
      }));

      expect(result).toEqual(
        jasmine.objectContaining({
          id: BOAT_ID,
          name: 'Aurora',
          description: null,
          createdBy: CREATOR_ID
        })
      );
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('propagates HTTP errors', () => {
      let error: unknown;

      service.createBoat({ name: 'Aurora', description: null }).subscribe({ error: (e) => (error = e) });

      httpTestingController
        .expectOne(BOAT_URL)
        .flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(error).toBeTruthy();
    });
  });

  describe('updateBoat', () => {
    it('sends a PUT request to the boat resource', () => {
      const payload: BoatMutationPayload = {
        name: 'Aurora II',
        description: 'Refit complete'
      };

      service.updateBoat(BOAT_ID, payload).subscribe();

      const request = httpTestingController.expectOne(`http://localhost:8080/api/boats/${BOAT_ID}`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual(payload);

      request.flush(createRawBoat({
        name: payload.name,
        description: payload.description
      }));
    });

    it('maps the updated boat response', () => {
      let result: Boat | undefined;
      const payload: BoatMutationPayload = { name: 'Aurora II', description: 'Refit complete' };

      service.updateBoat(BOAT_ID, payload).subscribe((boat) => (result = boat));

      httpTestingController.expectOne(`http://localhost:8080/api/boats/${BOAT_ID}`).flush(
        createRawBoat({
          name: payload.name,
          description: payload.description,
          createdAt: '2024-06-01T08:00:00Z'
        })
      );

      expect(result).toEqual(
        jasmine.objectContaining({
          id: BOAT_ID,
          name: 'Aurora II',
          description: 'Refit complete',
          createdBy: CREATOR_ID
        })
      );
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('propagates HTTP errors', () => {
      let error: unknown;

      service.updateBoat(BOAT_ID, { name: 'X', description: null }).subscribe({ error: (e) => (error = e) });

      httpTestingController
        .expectOne(`http://localhost:8080/api/boats/${BOAT_ID}`)
        .flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(error).toBeTruthy();
    });
  });

  describe('deleteBoat', () => {
    it('sends a DELETE request to the boat resource', () => {
      service.deleteBoat(BOAT_ID).subscribe();

      const request = httpTestingController.expectOne(`http://localhost:8080/api/boats/${BOAT_ID}`);
      expect(request.request.method).toBe('DELETE');
      request.flush(null);
    });

    it('propagates HTTP errors', () => {
      let error: unknown;

      service.deleteBoat(BOAT_ID).subscribe({ error: (e) => (error = e) });

      httpTestingController
        .expectOne(`http://localhost:8080/api/boats/${BOAT_ID}`)
        .flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(error).toBeTruthy();
    });
  });
});
