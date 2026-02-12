import { FormControl, FormGroup } from '@angular/forms';
import { AnnotationType } from '../../../models/annotation.model';

export type NewAnnotationForm = FormGroup<{
  text: FormControl<string | null>;
  imageBase64: FormControl<string | null>;
}>;

export interface NewAnnotationPayload {
  type: AnnotationType;
  text?: string;
  imageUrl?: string;
}
