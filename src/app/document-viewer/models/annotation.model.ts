export type AnnotationType = 'text' | 'image';

export interface AnnotationModel {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  x: number;
  y: number;
  text?: string;
  imageUrl?: string;
}

export interface PendingAnnotation {
  pageNumber: number;
  x: number;
  y: number;
}
