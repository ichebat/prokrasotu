import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ProductsService } from './services/products.service';
import { TelegramService } from './services/telegram.service';
import { SpinnerService } from './services/spinner.service';
import { registerLocaleData } from '@angular/common'; 
import localeRu from '@angular/common/locales/ru'; 


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, AfterViewChecked {
  title = 'Angular';
  showSpinner = false;
  // items = [1,2,3,4,5,6,7,8,9,0];

  

  telegram = inject(TelegramService);
  
  /**
   *
   */
  constructor(
    public spinnerService: SpinnerService,
    private cdRef: ChangeDetectorRef,
  ) {
    this.telegram.ready();
  }
  

  ngAfterViewChecked(): void {
    let showSpinner = this.spinnerService.visibility.getValue();
    if (showSpinner != this.showSpinner) {
      // check if it change, tell CD update view
      this.showSpinner = showSpinner;
      this.cdRef.detectChanges();
    }

    
    
  }

  ngOnInit() {
    registerLocaleData(localeRu);

    this.spinnerService.hide();

    
    // this.productsService.fetchProducts();
    // console.log("Length = "+this.productsService.products.length)
  }
}
