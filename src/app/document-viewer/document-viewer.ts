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

  private readonly documentResource = httpResource<Document>(() => `/api/${this.id()}1.json`);

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
}
