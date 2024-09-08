import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandLineIconComponent } from './brand-line-icon.component';

describe('BrandLineIconComponent', () => {
  let component: BrandLineIconComponent;
  let fixture: ComponentFixture<BrandLineIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BrandLineIconComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BrandLineIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
