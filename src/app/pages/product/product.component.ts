import { Component, OnDestroy, OnInit } from '@angular/core';
import { IProduct, ProductsService } from '../../services/products.service';
import { TelegramService } from '../../services/telegram.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent implements OnInit, OnDestroy {

  // subscription: Subscription;
  
  // product!: IProduct;
  /**
   *
   */
  constructor(
    public productsService: ProductsService,
    private cartService: CartService,
    private telegramService: TelegramService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) {

    const id = this.route.snapshot.paramMap.get('id');
    this.productsService.updateId(id);

    this.goBack = this.goBack.bind(this);
  }
  ngOnDestroy(): void {
    this.telegramService.BackButton.hide();
    this.telegramService.BackButton.offClick(this.goBack);
  }

  goBack() {
    this.location.back();
  }

  ngOnInit(): void {
    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе

    
  }
}
