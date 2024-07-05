import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

interface TgButton {
  show(): void;
  hide(): void;
  setText(text: string): void;
  onClick(fn: Function): void;
  offClick(fn: Function): void;
  enable(): void;
  disable(): void;
}

@Injectable({
  providedIn: 'root',
})
export class TelegramService {
  private window;
  tg;

  constructor(@Inject(DOCUMENT) private _document) {
    this.window = this._document.defaultView;
    this.tg = this.window.Telegram.WebApp;
  }

  get MainButton(): TgButton {
    return this.tg.MainButton;
  }

  get BackButton(): TgButton {
    return this.tg.BackButton;
  }

  //метод работает только если webapp приложение было запущено при помощи встроенной keyboard (кнопка "отправить сообщение" внизу)
  sendData(data: Object) {
    this.tg.sendData(JSON.stringify(data));
  }

  ready() {
    this.tg.ready();
  }
}
