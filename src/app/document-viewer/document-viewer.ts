import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { httpResource } from '@angular/common/http';
import { NgOptimizedImage } from '@angular/common';

import { Spinner } from '../shared/components/spinner/spinner';
import { Document } from '../core/models/document.model';
import { DocumentView, toDocumentView } from './models/document-view.model';
import { AnnotationModel } from './models/annotation.model';
import { Annotation } from './components/annotation/annotation';
import { AnnotationDialog } from './components/annotation-dialog/annotation-dialog';
import { Draggable, DragPosition } from '../shared/directives/draggable.directive';
import { ZoomControls } from './components/zoom-controls/zoom-controls';
import { PendingAnnotation } from './models/annotation.model';
import { NewAnnotationPayload } from './components/annotation-dialog/annotation-dialog.model';

@Component({
  selector: 'app-document-viewer',
  imports: [NgOptimizedImage, Spinner, Annotation, AnnotationDialog, Draggable, ZoomControls],
  templateUrl: './document-viewer.html',
  styleUrl: './document-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentViewer implements OnDestroy {
  public readonly id = input.required<string>(); // from router

  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  private readonly pageElements = viewChildren<ElementRef<HTMLDivElement>>('pageEl');
  private observer?: IntersectionObserver;
  private saveTimeoutId?: ReturnType<typeof setTimeout>;

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
    const map = new Map<number, AnnotationModel[]>();

    for (const annotation of this.annotations()) {
      const listByPage = map.get(annotation.pageNumber);

      if (listByPage) {
        listByPage.push(annotation);
      } else {
        map.set(annotation.pageNumber, [annotation]);
      }
    }

    return map;
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
    clearTimeout(this.saveTimeoutId);
  }

  protected zoomIn(): void {
    this.applyZoom(Math.min(this.zoomLevel() + this.zoomStep, this.maxZoom()));
  }

  protected zoomOut(): void {
    this.applyZoom(Math.max(this.zoomLevel() - this.zoomStep, this.minZoom()));
  }

  protected applyZoom(newZoom: number): void {
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
        id: crypto.randomUUID(),
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

  protected onAnnotationDragMove(id: string, pos: DragPosition): void {
    this.draggingAnnotationId.set(id);
    this.annotations.update((list) => {
      return list.map((item) => {
        if (item.id === id) {
          return { ...item, x: pos.x, y: pos.y };
        }

        return item;
      });
    });
  }

  protected onAnnotationDragEnd(): void {
    this.draggingAnnotationId.set(null);
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

    clearTimeout(this.saveTimeoutId);
    this.saveTimeoutId = setTimeout(() => {
      this.saveButtonText.set($localize`Сохранить`);
    }, 2000);
  }
}
