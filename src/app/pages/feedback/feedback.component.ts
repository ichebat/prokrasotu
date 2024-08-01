import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { TelegramService } from '../../services/telegram.service';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
})
export class FeedbackComponent implements OnInit, OnDestroy {
  feedback = signal('');
 

  /**
   *
   */
  constructor(private telegramService: TelegramService,
    private navigation: NavigationService,) {
    //при передаче параметра this теряется, поэтому забандить его в конструкторе
    this.sendData = this.sendData.bind(this);
    this.goBack = this.goBack.bind(this);
  }

  ngOnInit(): void {
    this.telegramService.MainButton.setText('Отправить сообщение в PROКРАСОТУ');
    // this.telegramService.MainButton.show();
    // this.telegramService.MainButton.disable();
    this.telegramService.MainButton.hide();
    this.telegramService.MainButton.onClick(this.sendData);

    
    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе

  }

  handleChange(event) {
    this.feedback.set(event.target.value);
    if (this.feedback().trim()) {
      this.telegramService.MainButton.show();
    } else {
      this.telegramService.MainButton.hide();
    }
  }

  sendData(sendData: any) {
    this.telegramService.sendData({ feedback: this.feedback() });
  }

  ngOnDestroy(): void {
    this.telegramService.MainButton.offClick(this.sendData); //при передаче параметра this теряется, поэтому забандить его в конструкторе

    
    this.telegramService.BackButton.hide();
    this.telegramService.BackButton.offClick(this.goBack);
  }

  goBack() {
    //this.location.back();
    this.navigation.back();
  }
}
