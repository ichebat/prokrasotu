import { Component, Input } from '@angular/core';
import { IOrder, OrderService } from '../../services/order.service';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-order-icon',
  templateUrl: './order-icon.component.html',
  styleUrl: './order-icon.component.scss'
})
export class OrderIconComponent {
  @Input() order!: IOrder;

  constructor(
    public orderService: OrderService,
  public telegramService: TelegramService){
      
    }

  orderStatus() {
    return this.orderService.getOrderStatus(this.order);
  }

}
