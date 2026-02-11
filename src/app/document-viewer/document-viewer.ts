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
import { Spinner } from '../spinner/spinner';
import { Document } from '../models/document.model';
import { DocumentView, toDocumentView } from '../models/document-view.model';

@Component({
  selector: 'app-document-viewer',
  imports: [NgOptimizedImage, Spinner],
  templateUrl: './document-viewer.html',
  styleUrl: './document-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentViewer implements OnDestroy {
  readonly id = input.required<string>(); // from router

  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  private readonly pageElements = viewChildren<ElementRef<HTMLDivElement>>('pageEl');
  private observer?: IntersectionObserver;

  private readonly documentResource = httpResource<Document>(() => `/api/${this.id()}.json`);

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

  protected readonly totalPages = computed(() => this.document()?.pages.length ?? 0);
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
}
