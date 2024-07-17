import { Component, OnDestroy, OnInit } from '@angular/core';
import { IProduct, ProductsService } from '../../services/products.service';
import { TelegramService } from '../../services/telegram.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
})
export class ProductComponent implements OnInit, OnDestroy {
  // subscription: Subscription;
  
  // product!: IProduct;
  /**
   *
   */
  constructor(
    public productsService: ProductsService,
    private telegramService: TelegramService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) {

    const id = this.route.snapshot.paramMap.get('id');
    this.productsService.updateId(id);

    // this.subscription = this.productsService.productList$.subscribe((value) => {
    //   this.product = value.find((p) => p.id == id);
    // });
    
    // this.product = this.productsService.getById(id!);
    // console.log(this.product);

    // this.productsService.getById(id!).subscribe((res) => {
    //   console.log(res);
    //   this.product = res;
    //   this.productsService.setProduct(res);
    // });
    //this.productsService.setProduct(this.product);
    this.goBack = this.goBack.bind(this);
  }
  ngOnDestroy(): void {
    this.telegramService.BackButton.offClick(this.goBack);
    // this.subscription.unsubscribe();
  }

  goBack() {
    //this.router.navigate(['']);
    this.location.back();
  }

  ngOnInit(): void {
    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе

    // this.productsService.product$.subscribe((value) => {
    //   this.product = value;
    // });
  }
}
