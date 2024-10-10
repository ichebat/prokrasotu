import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { TelegramService } from '../../services/telegram.service';
import { IProduct, ProductsService } from '../../services/products.service';
import { catchError, map, Observable, of, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';
import { OrderService } from '../../services/order.service';
import { DeliveryService } from '../../services/delivery.service';
import { CartService } from '../../services/cart.service';
import { HttpClient } from '@angular/common/http';
import { decrypt, environment } from '../../../environments/environment';
import { GitHubCdnService } from '../../services/git-hub-cdn.service';


@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
})
export class ShopComponent implements OnInit, OnDestroy, AfterViewInit {
  telegram = inject(TelegramService);
  navigation = inject(NavigationService);

  //@Input('category') categoryFromRoute = '';
  @Input() set category(category: string) {
    this.productsService.updateSelectedCategoryTranslit(category);
    if (category) {
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
    } else this.telegramService.BackButton.hide();
  }
  @Input() set type(type: string) {
    this.productsService.updateSelectedTypeTranslit(type);
    if (type)
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
  }
  @Input() set brand(brand: string) {
    this.productsService.updateSelectedBrandTranslit(brand);
    if (brand)
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
  }
  @Input() set brandLine(brandLine: string) {
    this.productsService.updateSelectedBrandLineTranslit(brandLine);
    if (brandLine)
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
  }
  @Input() set brandSeries(brandSeries: string) {
    //console.log("brandSeries: "+brandSeries);
    this.productsService.updateSelectedBrandSeriesTranslit(brandSeries);
    if (brandSeries)
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
  }

  tgString = JSON.stringify(this.telegram.tg);

  constructor(
    public productsService: ProductsService,
    public deliveryService: DeliveryService,
    private cartService: CartService,
    //private orderService: OrderService,
    private telegramService: TelegramService,
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private git: GitHubCdnService
  ) {
    //если запустили телеграм бота по прямой ссылке с параметром https://t.me/botusername/appname?startapp=someParamValue
    //то считываем someParamValue и парсим для перехода
    //проверяем тут, так как по умолчанию роут стоит на компонент Shop и запуск по ссылке приложения зайдет сюда
    if (!this.telegramService.isRedirectedByStartParam)
      if (this.telegramService.StartParam) {
        let routeUrl = this.telegramService.StartParam;
        console.log('Redirecting to ' + routeUrl);
        this.telegramService.isRedirectedByStartParam = true;
        this.router.navigate([routeUrl]);
      }

    this.goBack = this.goBack.bind(this);
  }
  ngAfterViewInit(): void {    
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  

  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.hide();
      this.telegramService.BackButton.offClick(this.goBack);
    }
    //this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
    }
  }

  onSearchClear() {
    this.productsService.updateFilter('');
  }

  goBack() {
    //this.router.navigate(['']);
    //this.location.back();
    this.navigation.back();
  }

  btnClick() {
    console.log('productBrandLines');
    console.log(this.productsService.$productBrandLines());

    console.log('productBrandSeriesList');
    console.log(this.productsService.$productBrandSeriesList());
  }
}
