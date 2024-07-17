import { Component, Input } from '@angular/core';
import { IProduct } from '../../services/products.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
})
export class ProductItemComponent {
  @Input() product!: IProduct;

  /**
   *
   */
  constructor(private location: Location) {
    
    
  }

  goBack() {
    //this.router.navigate(['']);
    this.location.back();
  }
  
}
