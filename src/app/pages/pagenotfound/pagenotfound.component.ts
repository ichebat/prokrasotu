import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-pagenotfound',
  templateUrl: './pagenotfound.component.html',
  styleUrl: './pagenotfound.component.scss',
})
export class PagenotfoundComponent implements OnInit, OnDestroy {
  constructor(
    private telegramService: TelegramService,
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
      //this.telegramService.BackButton.hide();
      //this.telegramService.BackButton.offClick(this.goBack);
    }
  }

  goBack() {
    //this.location.back();
    this.navigation.back();
  }
}
