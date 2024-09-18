import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { TelegramService } from '../../../services/telegram.service';
import { environment } from '../../../../environments/environment';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
})
export class ContactsComponent implements OnInit, OnDestroy {
  constructor(
    public telegramService: TelegramService,
    private navigation: NavigationService,
  ) {
    this.goBack = this.goBack.bind(this);
  }

  ngOnInit(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.show();
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
    }
  }

  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.hide();
      this.telegramService.BackButton.offClick(this.goBack);
    }
  }

  goBack() {
    this.navigation.back();
  }

  getUrlForTelegram() {
    return environment.webAppDirectLink;
  }
}
