import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AnnotationType } from '../../../models/annotation.model';

@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.html',
  styleUrl: './annotation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--annotation-x]': "x() + '%'",
    '[style.--annotation-y]': "y() + '%'",
  },
})
export class Annotation {
  public type = input<AnnotationType>('text');
  public text = input<string>();
  public imageUrl = input<string>();
  public x = input.required<number>();
  public y = input.required<number>();

  public deleteAnnotation = output<void>();
}
