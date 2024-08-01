import { Component, OnDestroy, OnInit } from '@angular/core';
import { TelegramService } from '../../services/telegram.service';
import { NavigationService } from '../../services/navigation.service';
import { OrderService } from '../../services/order.service';

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
    public orderService: OrderService,) 
    {

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
