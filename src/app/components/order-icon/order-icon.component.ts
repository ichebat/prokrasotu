import { Component, Input } from '@angular/core';
import { IOrder, OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-icon',
  templateUrl: './order-icon.component.html',
  styleUrl: './order-icon.component.scss'
})
export class OrderIconComponent {
  @Input() order!: IOrder;

  constructor(
    public orderService: OrderService,){
      
    }

  orderStatus() {
    return this.orderService.getOrderStatus(this.order);
  }

}
