import { Component, Input } from '@angular/core';
import { IProductBrandLine } from '../../services/products.service';

@Component({
  selector: 'app-brand-line-list',
  templateUrl: './brand-line-list.component.html',
  styleUrl: './brand-line-list.component.scss'
})
export class BrandLineListComponent {
  @Input() titleList = 'Angular';
  @Input() subtitleList = 'Angular';
  
  @Input() brandLines: IProductBrandLine[] = [];
  @Input() categoryName: string = '';  
  @Input() typeName: string = '';
  @Input() brandName: string = '';

  
}