import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandSeriesIconComponent } from './brand-series-icon.component';

describe('BrandSeriesIconComponent', () => {
  let component: BrandSeriesIconComponent;
  let fixture: ComponentFixture<BrandSeriesIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BrandSeriesIconComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BrandSeriesIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
