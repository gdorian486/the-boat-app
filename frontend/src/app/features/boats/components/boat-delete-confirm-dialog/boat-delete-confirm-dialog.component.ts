import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface BoatDeleteConfirmDialogData {
  name: string;
}

@Component({
  selector: 'app-boat-delete-confirm-dialog',
  imports: [A11yModule, MatButtonModule, MatDialogModule],
  templateUrl: './boat-delete-confirm-dialog.component.html',
  styleUrl: './boat-delete-confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoatDeleteConfirmDialogComponent {
  protected readonly data = inject<BoatDeleteConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<BoatDeleteConfirmDialogComponent, boolean>);

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
