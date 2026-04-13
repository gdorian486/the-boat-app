import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { BoatMutationPayload } from '../../models/boat.model';

export interface BoatFormDialogData {
  mode: 'create' | 'update';
  boat?: BoatMutationPayload;
}

@Component({
  selector: 'app-boat-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './boat-form-dialog.component.html',
  styleUrl: './boat-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoatFormDialogComponent {
  protected readonly data = inject<BoatFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<BoatFormDialogComponent, BoatMutationPayload>);

  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.boat?.name ?? '', [Validators.required, Validators.maxLength(255)]],
    description: [this.data.boat?.description ?? '', [Validators.maxLength(5000)]]
  });

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, description } = this.form.getRawValue();

    this.dialogRef.close({
      name: name.trim(),
      description: description.trim() || null
    });
  }
}
