import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'document/:id',
    loadComponent: () =>
      import('./document-viewer/document-viewer').then((m) => m.DocumentViewer),
  },
  { path: '**', redirectTo: '/document/1' },
];
