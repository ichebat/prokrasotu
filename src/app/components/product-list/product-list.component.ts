import { Component, Input, computed, signal } from '@angular/core';
import { IProduct, ProductClass } from '../../services/products.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
  @Input() titleList = 'Angular';
  @Input() subtitleList = 'Angular';
  @Input() defaultValue = 10;
  //@Input() products: ProductClass[] = [];
  @Input({ required: true }) set products(data: ProductClass[]) {
    this.productsDataSignal.set(data);
    this.limitSignal.set(10);
  }

  // internal collection of products
  private productsDataSignal = signal<ProductClass[]>([]);

  // how many products I want to display
  private limitSignal = signal<number>(10);

  dataSourceSignal = computed(() => {
    //console.log('dataSourceSignal from 0 to ',this.limitSignal());
    // slice data to display only portion of them
    const data = this.productsDataSignal().slice(0, this.limitSignal());

    // create correct data structure
    return data; 
  });

  /**
   *
   */
  constructor() {}
  

  // increase the number of displayed items
  onNearEndScroll(): void {
    this.limitSignal.update((val) => val + this.defaultValue);
  }
  
}
