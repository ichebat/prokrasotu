import { Component, Input } from '@angular/core';
import { IProduct } from '../../services/products.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent {
  @Input() title = 'Angular';
  @Input() subtitle = 'Angular';
  @Input() products: IProduct[] =[];

  /**
   *
   */
  constructor() {
    
    
  }

}
