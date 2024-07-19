import { Component, Input } from '@angular/core';
import { IProduct } from '../../services/products.service';


@Component({
  selector: 'app-product-icon',
  templateUrl: './product-icon.component.html',
  styleUrl: './product-icon.component.scss',
})
export class ProductIconComponent {
  @Input() product!: IProduct;

}
