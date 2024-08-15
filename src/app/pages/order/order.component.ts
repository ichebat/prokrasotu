import { Component, OnDestroy, OnInit } from '@angular/core';
import { TelegramService } from '../../services/telegram.service';
import { NavigationService } from '../../services/navigation.service';
import { OrderService } from '../../services/order.service';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss'
})
export class OrderComponent implements OnInit, OnDestroy {

  /**
   *
   */
  constructor(private telegramService: TelegramService,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private cartService: CartService,
    public orderService: OrderService,
  ) 
    {

      const id = this.route.snapshot.paramMap.get('id');
      this.orderService.updateId(id);

      this.orderService.$order

      this.goBack = this.goBack.bind(this);
  }
  ngOnInit(): void {
    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
  }
  ngOnDestroy(): void {
    this.telegramService.BackButton.hide();
    this.telegramService.BackButton.offClick(this.goBack);
  }

  goBack() {
    //this.location.back();
    this.navigation.back();
  }

}
