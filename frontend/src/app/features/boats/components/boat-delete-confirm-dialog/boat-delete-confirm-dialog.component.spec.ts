import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { BoatDeleteConfirmDialogComponent } from './boat-delete-confirm-dialog.component';

describe('BoatDeleteConfirmDialogComponent', () => {
  let dialogRefCloseSpy: jasmine.Spy;

  beforeEach(async () => {
    dialogRefCloseSpy = jasmine.createSpy('close');

    await TestBed.configureTestingModule({
      imports: [BoatDeleteConfirmDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { name: 'North Wind' }
        },
        {
          provide: MatDialogRef,
          useValue: { close: dialogRefCloseSpy }
        }
      ]
    }).compileComponents();
  });

  it('displays the boat name in the confirmation message', () => {
    const fixture = TestBed.createComponent(BoatDeleteConfirmDialogComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('North Wind');
  });

  it('displays the irreversibility warning', () => {
    const fixture = TestBed.createComponent(BoatDeleteConfirmDialogComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('This action cannot be undone.');
  });

  it('closes the dialog with false when Cancel is clicked', () => {
    const fixture = TestBed.createComponent(BoatDeleteConfirmDialogComponent);
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button');
    const cancelButton = Array.from(buttons).find((b) => b.textContent?.trim() === 'Cancel');
    cancelButton?.click();

    expect(dialogRefCloseSpy).toHaveBeenCalledWith(false);
  });

  it('closes the dialog with true when Delete is clicked', () => {
    const fixture = TestBed.createComponent(BoatDeleteConfirmDialogComponent);
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button');
    const deleteButton = Array.from(buttons).find((b) => b.textContent?.trim() === 'Delete');
    deleteButton?.click();

    expect(dialogRefCloseSpy).toHaveBeenCalledWith(true);
  });
});

