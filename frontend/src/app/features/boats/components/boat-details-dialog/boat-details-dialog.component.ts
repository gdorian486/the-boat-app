import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { Boat } from '../../models/boat.model';

export interface BoatDetailsDialogData {
  boat: Boat;
}

@Component({
  selector: 'app-boat-details-dialog',
  imports: [A11yModule, DatePipe, MatButtonModule, MatDialogModule],
  templateUrl: './boat-details-dialog.component.html',
  styleUrl: './boat-details-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoatDetailsDialogComponent {
  protected readonly boat = inject<BoatDetailsDialogData>(MAT_DIALOG_DATA).boat;
}
