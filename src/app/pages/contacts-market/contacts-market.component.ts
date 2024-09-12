import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { TelegramService } from '../../services/telegram.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contacts-market',
  templateUrl: './contacts-market.component.html',
  styleUrl: './contacts-market.component.scss'
})
export class ContactsMarketComponent  implements OnInit, OnDestroy{

  constructor(
    public telegramService: TelegramService,
    private navigation: NavigationService,){

      this.goBack = this.goBack.bind(this);

  }

  ngOnInit(): void {
    if (this.telegramService.IsTelegramWebAppOpened){      
      this.telegramService.BackButton.show();
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
    }
  }

  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened){      
      this.telegramService.BackButton.hide();
      this.telegramService.BackButton.offClick(this.goBack);
    }
  }

  goBack() {
    this.navigation.back();
  }

  getUrlForTelegram(){
    
      return environment.webAppDirectLink;
  }
}
