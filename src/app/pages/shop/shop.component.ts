import { Component, inject } from '@angular/core';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html'
})
export class ShopComponent {
  telegram = inject(TelegramService);

  /**
   *
   */
  constructor() {
    this.telegram.MainButton.show();
    
  }

}
