import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NewAnnotationForm } from './annotation-dialog.model';

@Component({
  selector: 'app-annotation-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './annotation-dialog.html',
  styleUrl: './annotation-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationDialog {
  public confirm = output<string>();
  public cancelAnnotation = output<void>();

  protected readonly form: NewAnnotationForm  = new FormGroup({
    text: new FormControl('', [Validators.required, Validators.minLength(1)]),
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.confirm.emit(this.form.value.text!.trim());
  }
}
