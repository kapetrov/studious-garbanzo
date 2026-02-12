import { Document } from './document.model';

export interface PageView {
  number: number;
  imageUrl: string;
}

export interface DocumentView {
  name: string;
  pages: PageView[];
}

export function toDocumentView(doc: Document): DocumentView {
  return {
    name: doc.name,
    pages: doc.pages.map((page) => ({
      number: page.number,
      imageUrl: `api/${page.imageUrl}`,
    })),
  };
}
