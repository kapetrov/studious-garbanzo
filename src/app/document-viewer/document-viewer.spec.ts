import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Component, input } from '@angular/core';
import { provideHttpClient, withInterceptors, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { DocumentViewer } from './document-viewer';
import { Document } from '../core/models/document.model';

const MOCK_DOCUMENT: Document = {
  name: 'Тестовый документ',
  pages: [
    { number: 1, imageUrl: 'pages/1.png' },
    { number: 2, imageUrl: 'pages/2.png' },
  ],
};

@Component({
  imports: [DocumentViewer],
  template: `<app-document-viewer [id]="id()" />`,
})
class TestDocumentViewer {
  id = input('1');
}

describe('DocumentViewer', () => {
  let fixture: ComponentFixture<TestDocumentViewer>;
  let viewerEl: HTMLElement;

  beforeEach(async () => {
    const noop = () => {
      /* empty */
    };
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = noop;
        unobserve = noop;
        disconnect = noop;
      },
    );

    await TestBed.configureTestingModule({
      imports: [TestDocumentViewer],
      providers: [
        provideHttpClient(
          withInterceptors([
            (req, next) => {
              if (req.url.endsWith('.json')) {
                return of(new HttpResponse({ body: MOCK_DOCUMENT }));
              }
              return next(req);
            },
          ]),
        ),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestDocumentViewer);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    viewerEl = fixture.debugElement.children[0].nativeElement;
  });

  afterEach(() => vi.restoreAllMocks());

  it('should render document name', () => {
    expect(viewerEl.querySelector('.document-name')?.textContent?.trim()).toBe(MOCK_DOCUMENT.name);
  });

  it('should render all pages', () => {
    expect(viewerEl.querySelectorAll('.page').length).toBe(MOCK_DOCUMENT.pages.length);
  });

  it('should zoom in and out', () => {
    const buttons = viewerEl.querySelectorAll<HTMLButtonElement>('.zoom-button');
    const zoomOut = buttons[0];
    const zoomIn = buttons[1];
    const select = viewerEl.querySelector<HTMLSelectElement>('.zoom-select')!;

    expect(select.value).toBe('100');

    zoomIn.click();
    fixture.detectChanges();
    expect(select.value).toBe('125');

    zoomOut.click();
    fixture.detectChanges();
    expect(select.value).toBe('100');
  });

  it('should add and remove annotations', () => {
    const viewer = fixture.debugElement.children[0].componentInstance as any;

    viewer.pendingAnnotation.set({ pageNumber: 1, x: 50, y: 50 });
    viewer.addAnnotation({ type: 'text', text: 'Тест' });
    fixture.detectChanges();

    expect(viewerEl.querySelectorAll('app-annotation').length).toBe(1);

    viewerEl.querySelector<HTMLButtonElement>('app-annotation .delete')!.click();
    fixture.detectChanges();

    expect(viewerEl.querySelectorAll('app-annotation').length).toBe(0);
  });

  it('should disable save button when no annotations', () => {
    expect(viewerEl.querySelector<HTMLButtonElement>('.save-button')!.disabled).toBe(true);
  });
});
