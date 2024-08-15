import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IOrder, OrderService } from '../../services/order.service';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrl: './order-item.component.scss'
})
export class OrderItemComponent implements OnInit, OnDestroy{

  @Input() order!: IOrder;

  constructor(
    private orderService: OrderService,
    private telegramService: TelegramService,
  )  {

  }


  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

}
