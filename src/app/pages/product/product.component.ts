import { Component, OnDestroy, OnInit } from '@angular/core';
import { IProduct, ProductsService } from '../../services/products.service';
import { TelegramService } from '../../services/telegram.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
})
export class ProductComponent implements OnInit, OnDestroy {
  product: any;
  /**
   *
   */
  constructor(
    private productsService: ProductsService,
    private telegramService: TelegramService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    this.productsService.getById(id!);
    //this.productsService.setProduct(this.product);
    this.goBack = this.goBack.bind(this);
  }
  ngOnDestroy(): void {
    this.telegramService.BackButton.offClick(this.goBack);
  }

  goBack() {
    this.router.navigate(['']);
  }

  ngOnInit(): void {
    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе

    this.productsService.product$.subscribe((value) => {
      this.product = value;
    });
  }
}
