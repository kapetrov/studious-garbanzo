import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input } from '@angular/core';
import { Annotation } from './annotation';
import { AnnotationType } from '../../models/annotation.model';

@Component({
  imports: [Annotation],
  template: `
    <app-annotation
      [type]="type()"
      [text]="text()"
      [x]="x()"
      [y]="y()"
      [isDragging]="isDragging()"
      (deleteAnnotation)="deleted = true"
    />
  `,
})
class TestHost {
  type = input<AnnotationType>('text');
  text = input<string | undefined>('Тестовая аннотация');
  x = input(10);
  y = input(20);
  isDragging = input(false);
  deleted = false;
}

describe('Annotation', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('should render annotation text', () => {
    expect(fixture.nativeElement.querySelector('.text')?.textContent?.trim()).toBe(
      'Тестовая аннотация',
    );
  });

  it('should emit delete event on button click', () => {
    fixture.nativeElement.querySelector('.delete').click();
    expect(fixture.componentInstance.deleted).toBe(true);
  });

  it('should position via CSS custom properties', () => {
    const el = fixture.debugElement.children[0].nativeElement as HTMLElement;
    expect(el.style.getPropertyValue('--annotation-x')).toBe('10%');
    expect(el.style.getPropertyValue('--annotation-y')).toBe('20%');
  });
});
