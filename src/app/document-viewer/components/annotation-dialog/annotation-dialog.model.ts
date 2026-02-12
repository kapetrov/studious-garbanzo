import { FormControl, FormGroup } from '@angular/forms';

export type NewAnnotationForm = FormGroup<{ text: FormControl<string | null> }>;
