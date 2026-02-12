import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input } from '@angular/core';
import { ZoomControls } from './zoom-controls';

const ZOOM_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25];

@Component({
  imports: [ZoomControls],
  template: `
    <app-zoom-controls
      [zoomPercentage]="percentage()"
      [canZoomIn]="canZoomIn()"
      [canZoomOut]="canZoomOut()"
      [options]="options()"
      (zoomIn)="lastEvent = 'in'"
      (zoomOut)="lastEvent = 'out'"
      (zoomChange)="lastChange = $event"
    />
  `,
})
class ZoomControlsTestHost {
  percentage = input(100);
  canZoomIn = input(true);
  canZoomOut = input(true);
  options = input(ZOOM_OPTIONS);
  lastEvent = '';
  lastChange: number | null = null;
}

describe('ZoomControls', () => {
  let fixture: ComponentFixture<ZoomControlsTestHost>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomControlsTestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoomControlsTestHost);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should render zoom buttons and select', () => {
    expect(el.querySelectorAll('.zoom-button').length).toBe(2);
    expect(el.querySelector('.zoom-select')).toBeTruthy();
  });

  it('should emit zoomIn on + click', () => {
    el.querySelectorAll<HTMLButtonElement>('.zoom-button')[1].click();
    expect(fixture.componentInstance.lastEvent).toBe('in');
  });

  it('should emit zoomOut on - click', () => {
    el.querySelectorAll<HTMLButtonElement>('.zoom-button')[0].click();
    expect(fixture.componentInstance.lastEvent).toBe('out');
  });

  it('should emit zoomChange on select change', () => {
    const select = el.querySelector<HTMLSelectElement>('.zoom-select')!;
    const selectedZoomOption = ZOOM_OPTIONS[1] * 100;
    select.value = String(selectedZoomOption);
    select.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.lastChange).toBe(selectedZoomOption);
  });
});
