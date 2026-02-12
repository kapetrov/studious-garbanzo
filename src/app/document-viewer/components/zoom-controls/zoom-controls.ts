import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-zoom-controls',
  templateUrl: './zoom-controls.html',
  styleUrl: './zoom-controls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomControls {
  public zoomPercentage = input.required<number>();
  public canZoomIn = input.required<boolean>();
  public canZoomOut = input.required<boolean>();
  public options = input.required<number[]>();

  public zoomIn = output();
  public zoomOut = output();
  public zoomChange = output<number>();

  protected onSelectChange(evt: Event): void {
    const target = evt.target as HTMLSelectElement;
    const value = Number(target.value);

    this.zoomChange.emit(value);
  }
}
