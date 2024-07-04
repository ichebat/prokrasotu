import { Component, OnInit, inject } from '@angular/core';
import { ProductsService } from './services/products.service';
import { TelegramService } from './services/telegram.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent  implements OnInit {
  title = 'Angular';
  // items = [1,2,3,4,5,6,7,8,9,0];

  telegram = inject(TelegramService);
  /**
   *
   */
  constructor() {
    
    this.telegram.ready();
  }

  ngOnInit() {
    
    // this.productsService.fetchProducts();
    // console.log("Length = "+this.productsService.products.length)

  }
 
}
