import { Component, Input } from '@angular/core';
import { IProduct, ProductClass } from '../../services/products.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {
  @Input() titleList = 'Angular';
  @Input() subtitleList = 'Angular';
  @Input() products: ProductClass[] = [];

  /**
   *
   */
  constructor() {}
}
