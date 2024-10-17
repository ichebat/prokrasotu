import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { TelegramService } from '../../services/telegram.service';
import { DeliveryService } from '../../services/delivery.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrl: './delivery.component.scss'
})
export class DeliveryComponent  implements OnInit, OnDestroy, AfterViewInit  {

  navigation = inject(NavigationService);
  owner = environment.owner;

  constructor(
    private telegramService: TelegramService,
    public deliveryService: DeliveryService,
  ) {
    this.goBack = this.goBack.bind(this);
  }

  
  goBack() {
    this.navigation.back();
  }

  ngOnInit(): void {  
    if (this.telegramService.IsTelegramWebAppOpened){       
      this.telegramService.BackButton.show();
      this.telegramService.BackButton.onClick(this.goBack);
    }
  }
  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened){     
      this.telegramService.BackButton.hide();     
      this.telegramService.BackButton.offClick(this.goBack);
    }    
  }

  ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

}
