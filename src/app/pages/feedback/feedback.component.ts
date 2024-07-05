import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
})
export class FeedbackComponent implements OnInit, OnDestroy {
  feedback = signal('');

  /**
   *
   */
  constructor(private telegramService: TelegramService) {
    //при передаче параметра this теряется, поэтому забандить его в конструкторе
    this.sendData = this.sendData.bind(this);
  }

  ngOnInit(): void {
    this.telegramService.MainButton.setText('ОЛтправить сообщение');
    this.telegramService.MainButton.show();
    this.telegramService.MainButton.disable();
    this.telegramService.MainButton.onClick(this.sendData);
  }

  handleChange(event) {
    this.feedback.set(event.target.value);
    if (this.feedback().trim()) {
      this.telegramService.MainButton.enable();
    } else {
      this.telegramService.MainButton.disable();
    }
  }

  sendData(sendData: any) {
    this.telegramService.sendData({ feedback: this.feedback() });
  }

  ngOnDestroy(): void {
    this.telegramService.MainButton.offClick(this.sendData); //при передаче параметра this теряется, поэтому забандить его в конструкторе
  }
}
