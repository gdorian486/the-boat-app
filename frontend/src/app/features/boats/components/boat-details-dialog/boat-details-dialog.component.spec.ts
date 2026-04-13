import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { UUID } from '../../models/boat.model';
import { BoatDetailsDialogComponent } from './boat-details-dialog.component';

const MOCK_BOAT = {
  id: '123e4567-e89b-12d3-a456-426614174000' as UUID,
  name: 'North Wind',
  description: 'A beautiful sailing boat',
  createdBy: 'abcd1234-e89b-12d3-a456-426614174999' as UUID,
  createdAt: new Date('2024-03-15T10:30:00Z')
};

describe('BoatDetailsDialogComponent', () => {
  describe('when boat has a description', () => {
    let fixture: ComponentFixture<BoatDetailsDialogComponent>;
    let nativeEl: HTMLElement;
    let dialogRefCloseSpy: jasmine.Spy;

    beforeEach(async () => {
      dialogRefCloseSpy = jasmine.createSpy('close');

      await TestBed.configureTestingModule({
        imports: [BoatDetailsDialogComponent],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: { boat: MOCK_BOAT } },
          { provide: MatDialogRef, useValue: { close: dialogRefCloseSpy } }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(BoatDetailsDialogComponent);
      fixture.detectChanges();
      nativeEl = fixture.nativeElement as HTMLElement;
    });

    // --- Creation ---

    it('should create', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    // --- Title ---

    it('should display "Boat details" as dialog title', () => {
      expect(nativeEl.textContent).toContain('Boat details');
    });

    // --- Boat data ---

    it('should display the boat ID', () => {
      expect(nativeEl.textContent).toContain(MOCK_BOAT.id);
    });

    it('should display the boat name', () => {
      expect(nativeEl.textContent).toContain(MOCK_BOAT.name);
    });

    it('should display the boat description', () => {
      expect(nativeEl.textContent).toContain(MOCK_BOAT.description);
    });

    it('should NOT display the "No description" fallback when description is provided', () => {
      expect(nativeEl.textContent).not.toContain('No description');
    });

    it('should display the createdBy UUID', () => {
      expect(nativeEl.textContent).toContain(MOCK_BOAT.createdBy);
    });

    it('should display the createdAt date (year is locale-independent)', () => {
      expect(nativeEl.textContent).toContain('2024');
    });

    // --- Structure ---

    it('should render a description list (<dl>)', () => {
      expect(nativeEl.querySelector('dl')).toBeTruthy();
    });

    it('should render exactly 5 detail rows', () => {
      const rows = nativeEl.querySelectorAll('.details-row');
      expect(rows.length).toBe(5);
    });

    it('should render all expected field labels', () => {
      const labels = Array.from(nativeEl.querySelectorAll('dt')).map((dt) => dt.textContent?.trim());
      expect(labels).toContain('ID');
      expect(labels).toContain('Name');
      expect(labels).toContain('Description');
      expect(labels).toContain('Created by');
      expect(labels).toContain('Created at');
    });

    it('should render each label inside a <dt> and value inside a <dd>', () => {
      const dts = nativeEl.querySelectorAll('dt');
      const dds = nativeEl.querySelectorAll('dd');
      expect(dts.length).toBe(5);
      expect(dds.length).toBe(5);
    });

    // --- Close button ---

    it('should render a single "Close" button', () => {
      const buttons = Array.from(nativeEl.querySelectorAll<HTMLButtonElement>('button'));
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent?.trim()).toBe('Close');
    });

    it('should close the dialog when "Close" is clicked', () => {
      const closeBtn = nativeEl.querySelector<HTMLButtonElement>('button');
      closeBtn?.click();
      expect(dialogRefCloseSpy).toHaveBeenCalled();
    });

    it('should have cdkFocusInitial on the Close button for keyboard accessibility', () => {
      const closeBtn = nativeEl.querySelector<HTMLButtonElement>('button');
      expect(closeBtn?.hasAttribute('cdkfocusinitial')).toBeTrue();
    });

    it('should have type="button" on the Close button to prevent accidental form submission', () => {
      const closeBtn = nativeEl.querySelector<HTMLButtonElement>('button');
      expect(closeBtn?.type).toBe('button');
    });
  });

  // --- Null description ---

  describe('when boat description is null', () => {
    let nativeEl: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BoatDetailsDialogComponent],
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: { boat: { ...MOCK_BOAT, description: null } }
          },
          { provide: MatDialogRef, useValue: { close: jasmine.createSpy() } }
        ]
      }).compileComponents();

      const fixture = TestBed.createComponent(BoatDetailsDialogComponent);
      fixture.detectChanges();
      nativeEl = fixture.nativeElement as HTMLElement;
    });

    it('should display "No description" as fallback', () => {
      expect(nativeEl.textContent).toContain('No description');
    });

    it('should not render the literal string "null"', () => {
      expect(nativeEl.textContent).not.toContain('null');
    });
  });
});

