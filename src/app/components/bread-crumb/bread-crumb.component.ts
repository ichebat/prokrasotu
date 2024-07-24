import { Component, inject } from '@angular/core';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-bread-crumb',
  templateUrl: './bread-crumb.component.html',
  styleUrl: './bread-crumb.component.scss'
})
export class BreadCrumbComponent {
  productsService = inject(ProductsService);

}
