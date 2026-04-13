import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config.token';
import { Boat, BoatMutationPayload, PagedResponse, UUID } from '../models/boat.model';
import { BoatsService } from './boats.service';

const MOCK_RUNTIME_CONFIG = {
  keycloakUrl: 'http://localhost:8081',
  keycloakRealm: 'boat',
  keycloakClientId: 'boat-frontend',
  apiBaseUrl: 'http://localhost:8080'
};

describe('BoatsService', () => {
  let service: BoatsService;
  let httpTestingController: HttpTestingController;
  const boatId = '123e4567-e89b-12d3-a456-426614174000' as UUID;
  const creatorId = '123e4567-e89b-12d3-a456-426614174001' as UUID;

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

      const request = httpTestingController.expectOne(
        (req) =>
          req.method === 'GET' &&
          req.url === 'http://localhost:8080/api/boats' &&
          req.params.get('page') === '2' &&
          req.params.get('size') === '50'
      );

      expect(request.request.method).toBe('GET');

      request.flush({
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

    it('throws an error when the API returns a malformed date', () => {
      let error: unknown;

      service.getBoats(0, 10).subscribe({ error: e => (error = e) });

      httpTestingController.expectOne(() => true).flush({
        content: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Ghost Ship',
          description: null,
          createdBy: '123e4567-e89b-12d3-a456-426614174001',
          createdAt: 'not-a-date'
        }],
        page: 0, size: 10, totalElements: 1,
        totalPages: 1, numberOfElements: 1,
        first: true, last: true, empty: false
      });

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('not-a-date');
    });

    it('propagates HTTP errors', () => {
      let error: unknown;

      service.getBoats(0, 10).subscribe({ error: e => (error = e) });

      httpTestingController.expectOne(() => true).flush(
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

      const request = httpTestingController.expectOne('http://localhost:8080/api/boats');
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(payload);

      request.flush({
        id: boatId,
        name: payload.name,
        description: payload.description,
        createdBy: creatorId,
        createdAt: '2024-01-15T10:30:00Z'
      });
    });

    it('maps the created boat response', () => {
      let result: Boat | undefined;

      service.createBoat({ name: 'Aurora', description: null }).subscribe((boat) => (result = boat));

      httpTestingController.expectOne('http://localhost:8080/api/boats').flush({
        id: boatId,
        name: 'Aurora',
        description: null,
        createdBy: creatorId,
        createdAt: '2024-01-15T10:30:00Z'
      });

      expect(result).toEqual(
        jasmine.objectContaining({
          id: boatId,
          name: 'Aurora',
          description: null,
          createdBy: creatorId
        })
      );
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('propagates HTTP errors', () => {
      let error: unknown;

      service.createBoat({ name: 'Aurora', description: null }).subscribe({ error: e => (error = e) });

      httpTestingController
        .expectOne('http://localhost:8080/api/boats')
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

      service.updateBoat(boatId, payload).subscribe();

      const request = httpTestingController.expectOne(`http://localhost:8080/api/boats/${boatId}`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual(payload);

      request.flush({
        id: boatId,
        name: payload.name,
        description: payload.description,
        createdBy: creatorId,
        createdAt: '2024-01-15T10:30:00Z'
      });
    });

    it('maps the updated boat response', () => {
      let result: Boat | undefined;
      const payload: BoatMutationPayload = { name: 'Aurora II', description: 'Refit complete' };

      service.updateBoat(boatId, payload).subscribe((boat) => (result = boat));

      httpTestingController.expectOne(`http://localhost:8080/api/boats/${boatId}`).flush({
        id: boatId,
        name: payload.name,
        description: payload.description,
        createdBy: creatorId,
        createdAt: '2024-06-01T08:00:00Z'
      });

      expect(result).toEqual(
        jasmine.objectContaining({
          id: boatId,
          name: 'Aurora II',
          description: 'Refit complete',
          createdBy: creatorId
        })
      );
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('propagates HTTP errors', () => {
      let error: unknown;

      service.updateBoat(boatId, { name: 'X', description: null }).subscribe({ error: e => (error = e) });

      httpTestingController
        .expectOne(`http://localhost:8080/api/boats/${boatId}`)
        .flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(error).toBeTruthy();
    });
  });

  describe('deleteBoat', () => {
    it('sends a DELETE request to the boat resource', () => {
      service.deleteBoat(boatId).subscribe();

      const request = httpTestingController.expectOne(`http://localhost:8080/api/boats/${boatId}`);
      expect(request.request.method).toBe('DELETE');
      request.flush(null);
    });

    it('propagates HTTP errors', () => {
      let error: unknown;

      service.deleteBoat(boatId).subscribe({ error: e => (error = e) });

      httpTestingController
        .expectOne(`http://localhost:8080/api/boats/${boatId}`)
        .flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(error).toBeTruthy();
    });
  });
});
