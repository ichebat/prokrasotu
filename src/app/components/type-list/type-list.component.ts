import { Component, Input } from '@angular/core';
import { IProductType } from '../../services/products.service';

@Component({
  selector: 'app-type-list',
  templateUrl: './type-list.component.html',
  styleUrl: './type-list.component.scss'
})
export class TypeListComponent {
  
  @Input() types: IProductType[] = [];
  @Input() categoryName: string = '';
  
  checkType(type: IProductType){
    return type.category.translit == this.categoryName || type.category.name == this.categoryName || !this.categoryName;
  }
}
