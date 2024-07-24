import { Component, Input } from '@angular/core';
import { IProductCategory } from '../../services/products.service';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent {
  @Input() titleList = 'Angular';
  @Input() subtitleList = 'Angular';
  
  @Input() categories: IProductCategory[] = [];

}
