import { Component, Input } from '@angular/core';
import { IProductBrand } from '../../services/products.service';

@Component({
  selector: 'app-brand-icon',
  templateUrl: './brand-icon.component.html',
  styleUrl: './brand-icon.component.scss'
})
export class BrandIconComponent {
  @Input() brand!: IProductBrand;
  @Input() categoryName: string = '';  
  @Input() typeName: string = '';


}
