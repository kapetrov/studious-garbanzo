import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

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
  public text = input.required<string>();
  public x = input.required<number>();
  public y = input.required<number>();

  public deleteAnnotation = output<void>();
}
