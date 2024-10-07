import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { IProduct, ProductClass, ProductsService } from '../../services/products.service';
import { TelegramService } from '../../services/telegram.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductComponent implements OnInit, OnDestroy, AfterViewInit {

// subscription: Subscription;

  // product!: IProduct;
  /**
   *
   */
  constructor(
    public productsService: ProductsService,
    private cartService: CartService,
    private telegramService: TelegramService,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) {
    
    const id = this.route.snapshot.paramMap.get('id');
    this.productsService.updateId(id);

    //console.log(this.router.url);

    this.goBack = this.goBack.bind(this);
  }
  
  ngAfterViewInit(): void {
    // Hack: Scrolls to top of Page after page view initialized
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  getUrl() {
    return this.router.url;
  }
  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.hide();
      this.telegramService.BackButton.offClick(this.goBack);
    }
  }

  goBack() {
    //this.location.back();
    this.navigation.back();
  }

  ngOnInit(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.show();
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
    }
  }
}
