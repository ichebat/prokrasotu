import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgxComponent } from './imgx.component';

describe('ImgxComponent', () => {
  let component: ImgxComponent;
  let fixture: ComponentFixture<ImgxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImgxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImgxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
