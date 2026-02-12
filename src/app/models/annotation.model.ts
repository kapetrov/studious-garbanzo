export type AnnotationType = 'text' | 'image';

export interface Annotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  x: number;
  y: number;
  text?: string;
  imageUrl?: string;
}
