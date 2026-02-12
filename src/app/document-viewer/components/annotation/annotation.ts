import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { AnnotationType } from '../../models/annotation.model';

@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.html',
  styleUrl: './annotation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--annotation-x]': "x() + '%'",
    '[style.--annotation-y]': "y() + '%'",
    '[style.opacity]': 'opacity()',
    '[style.z-index]': 'zIndex()',
  },
})
export class Annotation {
  public type = input<AnnotationType>('text');
  public text = input<string>();
  public imageUrl = input<string>();
  public x = input.required<number>();
  public y = input.required<number>();
  public isDragging = input(false);

  public deleteAnnotation = output<void>();

  protected opacity = computed(() => (this.isDragging() ? 0.8 : 1));
  protected zIndex = computed(() => (this.isDragging() ? 1000 : 5));
}
