import { Component, Input } from '@angular/core';
import { OrderClass } from '../../services/order.service';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss'
})
export class OrderListComponent {
  @Input() titleList = 'Angular';
  @Input() subtitleList = 'Angular';
  @Input() orders: OrderClass[] = [];
  

}
