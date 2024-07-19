import { Component, Input } from '@angular/core';
import { IProductCategory } from '../../services/products.service';

@Component({
  selector: 'app-category-icon',
  templateUrl: './category-icon.component.html',
  styleUrl: './category-icon.component.scss'
})
export class CategoryIconComponent {
  @Input() category!: IProductCategory;


}
