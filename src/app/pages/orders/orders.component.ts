import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TelegramService } from '../../services/telegram.service';
import { NavigationService } from '../../services/navigation.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent  implements OnInit, OnDestroy {
  
 navigation = inject(NavigationService);

 
  ngOnInit(): void {  
    this.telegramService.BackButton.onClick(this.goBack);
  }
  ngOnDestroy(): void {
    this.telegramService.BackButton.offClick(this.goBack);
  }

  /**
   *
   */
  constructor(
    private telegramService: TelegramService,
    public orderService: OrderService,
  ) {
    this.goBack = this.goBack.bind(this);
  }

  goBack() {
    //this.router.navigate(['']);
    //this.location.back();
    this.navigation.back();
  }

}
