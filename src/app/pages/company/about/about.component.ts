import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { TelegramService } from '../../../services/telegram.service';
import { NavigationService } from '../../../services/navigation.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit, OnDestroy, AfterViewInit {
  owner = environment.owner;

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
      //this.telegramService.BackButton.hide();
      //this.telegramService.BackButton.offClick(this.goBack);
    }
  }

  goBack() {
    this.navigation.back();
  }

  ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }
}
