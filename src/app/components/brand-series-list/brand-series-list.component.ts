import { Component, Input } from '@angular/core';
import { IProductBrandSeries } from '../../services/products.service';

@Component({
  selector: 'app-brand-series-list',
  templateUrl: './brand-series-list.component.html',
  styleUrl: './brand-series-list.component.scss'
})
export class BrandSeriesListComponent {
  @Input() titleList = 'Angular';
  @Input() subtitleList = 'Angular';
  
  @Input() brandSeriesList: IProductBrandSeries[] = [];
  @Input() categoryName: string = '';  
  @Input() typeName: string = '';
  @Input() brandName: string = '';
  @Input() brandLine: string = '';

  
}