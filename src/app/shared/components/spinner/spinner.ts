import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `<div class="spinner"></div>`,
  styles: `
    :host {
      --spinner-size: 32px;
    }

    .spinner {
      width: var(--spinner-size);
      aspect-ratio: 1;
      height: 32px;

      border: 4px solid var(--color-border);
      border-top-color: var(--color-text-subtle);
      border-radius: 50%;

      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      100% {
        transform: rotate(360deg);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spinner {}
