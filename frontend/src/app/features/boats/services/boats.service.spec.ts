import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config.token';
import { Boat, BoatsService, PagedResponse } from './boats.service';

const MOCK_RUNTIME_CONFIG = {
  keycloakUrl: 'http://localhost:8081',
  keycloakRealm: 'boat',
  keycloakClientId: 'boat-frontend',
  apiBaseUrl: 'http://localhost:8080'
};

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

      httpTestingController.expectOne(
        (req) =>
          req.method === 'GET' &&
          req.url === 'http://localhost:8080/api/boats' &&
          req.params.get('page') === '2' &&
          req.params.get('size') === '50'
      ).flush({
        content: [],
        page: 2,
        size: 50,
        totalElements: 100,
        totalPages: 2,
        numberOfElements: 0,
        first: false,
        last: true,
        empty: true
      });
    });

    it('maps createdAt ISO string to a Date object', () => {
      let result: PagedResponse<Boat> | undefined;

      service.getBoats(0, 10).subscribe(r => (result = r));

      httpTestingController.expectOne(() => true).flush({
        content: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Titanic',
          description: null,
          createdBy: '123e4567-e89b-12d3-a456-426614174001',
          createdAt: '2024-01-15T10:30:00Z'
        }],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        numberOfElements: 1,
        first: true,
        last: true,
        empty: false
      });

      const boat = result!.content[0];
      expect(boat.createdAt).toBeInstanceOf(Date);
      expect(boat.createdAt.getFullYear()).toBe(2024);
      expect(boat.createdAt.getMonth()).toBe(0); // janvier
      expect(boat.createdAt.getDate()).toBe(15);
    });

    it('preserves null description', () => {
      let result: PagedResponse<Boat> | undefined;

      service.getBoats(0, 10).subscribe(r => (result = r));

      httpTestingController.expectOne(() => true).flush({
        content: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Titanic',
          description: null,
          createdBy: '123e4567-e89b-12d3-a456-426614174001',
          createdAt: '2024-01-15T10:30:00Z'
        }],
        page: 0, size: 10, totalElements: 1,
        totalPages: 1, numberOfElements: 1,
        first: true, last: true, empty: false
      });

      expect(result!.content[0].description).toBeNull();
    });

    it('throws an error when the API returns a non-UUID id', () => {
      let error: unknown;

      service.getBoats(0, 10).subscribe({ error: e => (error = e) });

      httpTestingController.expectOne(() => true).flush({
        content: [{
          id: 'not-a-uuid',
          name: 'Ghost Ship',
          description: null,
          createdBy: '123e4567-e89b-12d3-a456-426614174001',
          createdAt: '2024-01-15T10:30:00Z'
        }],
        page: 0, size: 10, totalElements: 1,
        totalPages: 1, numberOfElements: 1,
        first: true, last: true, empty: false
      });

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('not-a-uuid');
    });
  });
});
