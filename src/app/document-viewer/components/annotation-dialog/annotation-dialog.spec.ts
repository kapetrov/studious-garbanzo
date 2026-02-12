import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnnotationDialog } from './annotation-dialog';

describe('AnnotationDialog', () => {
  let fixture: ComponentFixture<AnnotationDialog>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotationDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnotationDialog);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should start in text mode', () => {
    expect(el.querySelector('.text-input')).toBeTruthy();
    expect(el.querySelector('input[type="file"]')).toBeFalsy();
  });

  it('should switch between text and image modes', () => {
    const tabs = el.querySelectorAll<HTMLButtonElement>('.mode-tabs button');

    tabs[1].click();
    fixture.detectChanges();
    expect(el.querySelector('input[type="file"]')).toBeTruthy();

    tabs[0].click();
    fixture.detectChanges();
    expect(el.querySelector('.text-input')).toBeTruthy();
  });

  it('should disable submit when text is empty', () => {
    expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  });

  it('should emit confirm on valid submit', () => {
    let payload: any = null;
    fixture.componentInstance.confirm.subscribe((p) => (payload = p));

    const input = el.querySelector<HTMLInputElement>('.text-input')!;
    input.value = 'Тест';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    el.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(payload).toBeTruthy();
    expect(payload?.text).toBe('Тест');
  });

  it('should emit cancel on overlay click', () => {
    let cancelled = false;
    fixture.componentInstance.cancelAnnotation.subscribe(() => (cancelled = true));

    el.querySelector<HTMLElement>('.overlay')!.click();
    expect(cancelled).toBe(true);
  });
});
