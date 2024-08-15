import { Component, Input } from '@angular/core';
import { IOrder } from '../../services/order.service';

@Component({
  selector: 'app-order-icon',
  templateUrl: './order-icon.component.html',
  styleUrl: './order-icon.component.scss'
})
export class OrderIconComponent {
  @Input() order!: IOrder;

}
