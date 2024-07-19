import { Component, Input } from '@angular/core';
import { IProductBrand } from '../../services/products.service';

@Component({
  selector: 'app-brand-list',
  templateUrl: './brand-list.component.html',
  styleUrl: './brand-list.component.scss'
})
export class BrandListComponent {
  @Input() brands: IProductBrand[] = [];
  @Input() categoryName: string = '';  
  @Input() typeName: string = '';

  checkBrand(brand: IProductBrand){
    return brand.types.findIndex(p=>(p.name == this.typeName || p.translit == this.typeName || !this.typeName) && (p.category.name == this.categoryName || p.category.translit == this.categoryName || !this.categoryName))>=0;
  }

}
