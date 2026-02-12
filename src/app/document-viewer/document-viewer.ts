import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { httpResource } from '@angular/common/http';
import { NgOptimizedImage } from '@angular/common';
import { fromEvent, switchMap, map, takeUntil, tap, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Spinner } from '../shared/components/spinner/spinner';
import { Document } from '../models/document.model';
import { DocumentView, toDocumentView } from '../models/document-view.model';
import { Annotation as AnnotationModel } from '../models/annotation.model';
import { Annotation } from './components/annotation/annotation';
import { AnnotationDialog } from './components/annotation-dialog/annotation-dialog';
import { generateUUID } from '../shared/utils/generate-uuid';
import { PendingAnnotation } from './document-viewer.model';
import { NewAnnotationPayload } from './components/annotation-dialog/annotation-dialog.model';

@Component({
  selector: 'app-document-viewer',
  imports: [NgOptimizedImage, Spinner, Annotation, AnnotationDialog],
  templateUrl: './document-viewer.html',
  styleUrl: './document-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentViewer implements OnDestroy {
  readonly id = input.required<string>(); // from router

  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  private readonly pageElements = viewChildren<ElementRef<HTMLDivElement>>('pageEl');
  private observer?: IntersectionObserver;
  private readonly destroyRef = inject(DestroyRef);

  private readonly documentResource = httpResource<Document>(() => `api/${this.id()}.json`);

  protected readonly document = computed<DocumentView | null>(() =>
    this.documentResource.hasValue() ? toDocumentView(this.documentResource.value()!) : null,
  );
  protected readonly loading = this.documentResource.isLoading;
  protected readonly error = computed(() => {
    const error = this.documentResource.error();

    if (!error) {
      return null;
    }

    return error.message;
  });
  protected readonly currentPageNumber = signal(1);
  protected readonly annotations = signal<AnnotationModel[]>([]);
  protected readonly pendingAnnotation = signal<PendingAnnotation | null>(null);
  protected readonly draggingAnnotationId = signal<string | null>(null);
  protected readonly saveButtonText = signal('Сохранить');

  protected readonly totalPages = computed(() => this.document()?.pages.length ?? 0);
  protected readonly canSaveDocument = computed(
    () => this.document() !== null && this.annotations().length > 0,
  );
  protected readonly annotationsByPage = computed(() => {
    return this.annotations().reduce<Record<number, AnnotationModel[]>>(
      (prev, curr) => ({
        ...prev,
        [curr.pageNumber]: [...(prev[curr.pageNumber] ?? []), curr],
      }),
      {},
    );
  });
  protected readonly pageIndicator = computed(() => {
    const total = this.totalPages();

    if (!total) {
      return null;
    }

    const current = this.currentPageNumber();
    return $localize`:@@pageIndicator:Страница ${current}:current: из ${total}:total:`;
  });

  protected readonly zoomStep = 0.25;
  protected readonly zoomSelectOptions = computed(() => {
    return Array(10)
      .fill(0)
      .map((_, i) => (i + 1) * this.zoomStep);
  });
  protected readonly minZoom = computed(() => this.zoomSelectOptions().at(0)!);
  protected readonly maxZoom = computed(() => this.zoomSelectOptions().at(-1)!);

  protected readonly zoomLevel = signal(1);
  protected readonly canZoomIn = computed(() => this.zoomLevel() < this.maxZoom());
  protected readonly canZoomOut = computed(() => this.zoomLevel() > this.minZoom());

  protected readonly zoomPercentage = computed(() => Math.round(this.zoomLevel() * 100));

  constructor() {
    effect(() => {
      const pages = this.pageElements();
      const container = this.scrollContainer()?.nativeElement;

      if (!pages?.length || !container) {
        return;
      }

      this.observer?.disconnect();
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const pageNumber = Number(entry.target.getAttribute('data-page-number') || '1');
              this.currentPageNumber.set(pageNumber);
            }
          });
        },
        { root: container, threshold: 0.5 },
      );

      pages.forEach((el) => this.observer!.observe(el.nativeElement));
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  protected zoomIn(): void {
    this.applyZoom(Math.min(this.zoomLevel() + this.zoomStep, this.maxZoom()));
  }

  protected zoomOut(): void {
    this.applyZoom(Math.max(this.zoomLevel() - this.zoomStep, this.minZoom()));
  }

  protected onZoomChange(evt: Event): void {
    const select = evt.target as HTMLSelectElement;
    const percentage = Number(select.value);
    this.applyZoom(percentage / 100);
  }

  private applyZoom(newZoom: number): void {
    const container = this.scrollContainer()?.nativeElement;
    this.zoomLevel.set(newZoom);

    if (!container || container.scrollHeight <= 0) {
      return;
    }

    const scrollRatio = container.scrollTop / container.scrollHeight;

    // To prevent flickering, we need to wait for the next animation frame
    requestAnimationFrame(() => {
      container.scrollTop = scrollRatio * container.scrollHeight;
    });
  }

  protected onPageClick(event: MouseEvent, pageNumber: number): void {
    const pageElement = event.currentTarget as HTMLElement;
    const rect = pageElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    console.log({ pageNumber, x, y, rect });

    if (x < 0 || x > 100 || y < 0 || y > 100) {
      console.log({ x, y });
      return;
    }

    this.pendingAnnotation.set({ pageNumber, x, y });
  }

  protected addAnnotation(payload: NewAnnotationPayload): void {
    const pending = this.pendingAnnotation();

    if (!pending) {
      return;
    }

    this.annotations.update((items) => [
      ...items,
      {
        id: generateUUID(),
        ...pending,
        ...payload,
      },
    ]);
    this.pendingAnnotation.set(null);
  }

  protected cancelAnnotation(): void {
    this.pendingAnnotation.set(null);
  }

  protected deleteAnnotation(id: string): void {
    this.annotations.update((list) => {
      return list.filter((item) => item.id !== id);
    });
  }

  protected onAnnotationPointerDown(
    evt: PointerEvent,
    annotation: AnnotationModel,
    pageEl: HTMLElement,
  ): void {
    evt.preventDefault();
    evt.stopPropagation();

    this.draggingAnnotationId.set(annotation.id);

    const startX = annotation.x;
    const startY = annotation.y;
    const pageRect = pageEl.getBoundingClientRect();

    const pointerMove$ = fromEvent<PointerEvent>(document, 'pointermove');
    const pointerUp$ = fromEvent<PointerEvent>(document, 'pointerup');

    /*
      Мы храним координаты аннотаций в %, чтобы при изменении zoomLevel/resize окна они не поплыли
      Логика рассчета такая:
        1. Вычислить дельту - на сколько курсор сдвинулся от изначальной позиции, когда сработал pointermove, до текущей позиции
        2. Перевожу эту дельту в проценты, поделив на ширину (для х) и высоту (для у) страницы, умножаю на 100%, чтобы удобно скормить аннотации с целью позиционирования
        3. Прибавляю новую дельту к ранее записанной x/y координате аннотации
      Результат: { newX: startX + (deltaPixelsX / pageWidthPx) * 100, newY: startY + (deltaPixelsY / pageHeightPx) * 100 }
    */
    pointerMove$
      .pipe(
        map((move) => ({
          x: startX + ((move.clientX - evt.clientX) / pageRect.width) * 100,
          y: startY + ((move.clientY - evt.clientY) / pageRect.height) * 100,
        })),
        takeUntil(
          pointerUp$.pipe(
            tap(() => {
              this.draggingAnnotationId.set(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pos) => {
        this.updateAnnotationPosition(annotation.id, pos.x, pos.y);
      });
  }

  private updateAnnotationPosition(id: string, x: number, y: number): void {
    this.annotations.update((list) => {
      return list.map((item) => {
        if (item.id === id) {
          return { ...item, x, y };
        }

        return item;
      });
    });
  }

  protected saveDocument(): void {
    const document = this.document();

    if (!document) {
      return;
    }

    const saveData = {
      name: document.name,
      pages: document.pages,
      annotations: this.annotations(),
    };

    console.log(saveData);

    this.saveButtonText.set($localize`Сохранено!`);

    setTimeout(() => {
      this.saveButtonText.set($localize`Сохранить`);
    }, 2000);
  }
}
