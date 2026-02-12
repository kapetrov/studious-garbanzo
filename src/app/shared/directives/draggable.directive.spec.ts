import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Draggable, DragPosition } from './draggable.directive';

@Component({
  imports: [Draggable],
  template: `
    <div #container style="width: 500px; height: 400px;">
      <div
        appDraggable
        [dragContainer]="container"
        [dragX]="x()"
        [dragY]="y()"
        (dragMove)="lastMove = $event"
        (dragEnd)="lastEnd = $event"
      ></div>
    </div>
  `,
})
class DraggableTestHost {
  x = signal(10);
  y = signal(20);
  lastMove: DragPosition | null = null;
  lastEnd: DragPosition | null = null;
  draggable = viewChild.required(Draggable);
}

function pointerEvent(type: string, clientX = 0, clientY = 0): PointerEvent {
  return new PointerEvent(type, { clientX, clientY, bubbles: true });
}

describe('Draggable', () => {
  let fixture: ComponentFixture<DraggableTestHost>;
  let host: DraggableTestHost;
  let draggableEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DraggableTestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(DraggableTestHost);
    fixture.detectChanges();
    host = fixture.componentInstance;
    draggableEl = fixture.nativeElement.querySelector('[appDraggable]');
  });

  it('should set cursor style', () => {
    expect(draggableEl.style.cursor).toBe('move');
  });

  it('should emit dragMove on pointermove after pointerdown', () => {
    draggableEl.dispatchEvent(pointerEvent('pointerdown', 100, 100));
    document.dispatchEvent(pointerEvent('pointermove', 150, 120));

    expect(host.lastMove).toBeTruthy();
    expect(host.lastMove!.x).toBeGreaterThan(10);
    expect(host.lastMove!.y).toBeGreaterThan(20);
  });

  it('should emit dragEnd on pointerup', () => {
    draggableEl.dispatchEvent(pointerEvent('pointerdown', 100, 100));
    document.dispatchEvent(pointerEvent('pointermove', 150, 120));
    document.dispatchEvent(pointerEvent('pointerup'));

    expect(host.lastEnd).toBeTruthy();
  });

  it('should not emit dragMove without pointerdown', () => {
    document.dispatchEvent(pointerEvent('pointermove', 150, 120));
    expect(host.lastMove).toBeNull();
  });
});
