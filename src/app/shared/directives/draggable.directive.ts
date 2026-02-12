import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, map, merge, of, switchMap, takeUntil, tap } from 'rxjs';

export interface DragPosition {
  x: number;
  y: number;
}

@Directive({
  selector: '[appDraggable]',
  host: {
    style: 'cursor: move',
  },
})
export class Draggable {
  private elementRef = inject(ElementRef<HTMLElement>);

  public dragContainer = input.required<HTMLElement>();
  public dragX = input.required<number>();
  public dragY = input.required<number>();

  public dragMove = output<DragPosition>();
  public dragEnd = output<DragPosition>();

  constructor() {
    fromEvent<PointerEvent>(this.elementRef.nativeElement, 'pointerdown')
      .pipe(
        tap((evt) => {
          evt.preventDefault();
          evt.stopPropagation();
        }),
        switchMap((startEvt) => {
          const startX = this.dragX();
          const startY = this.dragY();
          const container = this.dragContainer();

          if (!container) {
            return of(null);
          }

          const containerRect = container.getBoundingClientRect();
          const pageWidthPx = containerRect.width;
          const pageHeightPx = containerRect.height;
          return fromEvent<PointerEvent>(document, 'pointermove').pipe(
            /*
              Мы храним координаты аннотаций в %, чтобы при изменении zoomLevel/resize окна они не поплыли
              Логика рассчета такая:
                1. Вычислить дельту - на сколько курсор сдвинулся от изначальной позиции, когда сработал pointermove, до текущей позиции
                2. Перевожу эту дельту в проценты, поделив на ширину (для х) и высоту (для у) страницы, умножаю на 100%, чтобы удобно скормить аннотации с целью позиционирования
                3. Прибавляю новую дельту к ранее записанной x/y координате аннотации
              Результат: {
                newX: startX + (deltaPixelsX / pageWidthPx) * 100,
                newY: startY + (deltaPixelsY / pageHeightPx) * 100
              }
            */
            map((moveEvt) => ({
              x: startX + ((moveEvt.clientX - startEvt.clientX) / pageWidthPx) * 100,
              y: startY + ((moveEvt.clientY - startEvt.clientY) / pageHeightPx) * 100,
            })),
            tap((pos) => {
              this.dragMove.emit(pos);
            }),
            takeUntil(
              merge(
                fromEvent<PointerEvent>(document, 'pointerup'),
                fromEvent<PointerEvent>(document, 'pointercancel'),
              ).pipe(
                tap(() => {
                  this.dragEnd.emit({ x: this.dragX(), y: this.dragY() });
                }),
              ),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
