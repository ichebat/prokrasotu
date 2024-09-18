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
import { ThemeSwitchService } from './services/theme-switch.service';
import { config } from 'dotenv';

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
    public readonly _themeswitchService: ThemeSwitchService,
  ) {
    this.telegram.ready();

  }

  ngAfterViewChecked(): void {
    //let showSpinner = this.spinnerService.visibility.getValue();
    let showSpinner = this.spinnerService.isVisible();
    if (showSpinner != this.showSpinner) {
      // check if it change, tell CD update view
      this.showSpinner = showSpinner;
      this.cdRef.detectChanges();
    }
  }

  ngOnInit() {
    registerLocaleData(localeRu);

    this.spinnerService.hide();

    var isDarkThemeActive = window.localStorage.getItem('isDarkThemeActive');
    if (isDarkThemeActive) {
      this._themeswitchService.isDarkThemeActive.next(
        isDarkThemeActive == 'true',
      );
      this._themeswitchService.OnThemeSwitch.next(isDarkThemeActive == 'true');
    }

    // this.productsService.fetchProducts();
    // console.log("Length = "+this.productsService.products.length)
  }
}
