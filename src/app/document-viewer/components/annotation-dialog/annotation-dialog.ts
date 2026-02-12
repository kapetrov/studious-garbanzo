import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NewAnnotationPayload, NewAnnotationForm } from './annotation-dialog.model';
import { AnnotationType } from '../../../models/annotation.model';

@Component({
  selector: 'app-annotation-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './annotation-dialog.html',
  styleUrl: './annotation-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationDialog {
  public confirm = output<NewAnnotationPayload>();
  public cancelAnnotation = output<void>();

  protected mode = signal<AnnotationType>('text');
  protected imagePreview = signal<string | null>(null);

  protected form: NewAnnotationForm = new FormGroup(
    {
      text: new FormControl(''),
      imageBase64: new FormControl(''),
    },
    [
      (form) => {
        if (!isAnnotationForm(form)) {
          return null;
        }

        if (!form.controls.imageBase64.value && !form.controls.text.value) {
          return { invalid: true };
        }

        return null;
      },
    ],
  );

  protected setMode(mode: AnnotationType): void {
    this.mode.set(mode);

    if (mode === 'text') {
      this.form.controls.imageBase64.clearValidators();
      this.form.controls.text.setValidators([Validators.required]);
    } else {
      this.form.controls.text.clearValidators();
      this.form.controls.imageBase64.setValidators([Validators.required]);
    }
  }

  protected onFileChange(evt: Event): void {
    const input = evt.target as HTMLInputElement;

    if (!input.files?.length) {
      this.imagePreview.set(null);
      return;
    }

    const file = input.files[0];

    if (!file) {
      this.imagePreview.set(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.form.setValue({
        text: null,
        imageBase64: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { text, imageBase64 } = this.form.getRawValue();

    this.confirm.emit({
      type: this.mode(),
      text: text?.trim() ?? undefined,
      imageUrl: imageBase64 ?? undefined,
    });
  }
}

function isAnnotationForm(
  control: AbstractControl | NewAnnotationForm,
): control is NewAnnotationForm {
  return control instanceof FormGroup;
}
