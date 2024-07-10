import { Component, Input } from '@angular/core';
import { IProduct } from '../../services/products.service';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html'
})
export class ProductItemComponent {
  @Input() product!: IProduct;
  
}
