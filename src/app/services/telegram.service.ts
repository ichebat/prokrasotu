import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICartItem, IShoppingCart } from './cart.service';

interface TgButton {
  show(): void;
  hide(): void;
  setText(text: string): void;
  onClick(fn: Function): void;
  offClick(fn: Function): void;
  //onEvent(eventName:string, fn: Function): void;
  enable(): void;
  disable(): void;
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TelegramService {
  private window;
  tg;
  private url = environment.sendDataToTelegramUrl;

  constructor(
    @Inject(DOCUMENT) private _document,
    private _http: HttpClient,
  ) {
    this.window = this._document.defaultView;
    this.tg = this.window.Telegram.WebApp;
  }

  // updateId(id) {
  //   this.$chat_id.set(id);
  // }

  get MainButton(): TgButton {
    return this.tg.MainButton;
  }

  get BackButton(): TgButton {
    return this.tg.BackButton;
  }

  get UserName(): string {
    return this.tg.initDataUnsafe?.user?.username;
  }

  get Id(): string {
    
    if (!this.tg.initDataUnsafe?.user?.id && !environment.production) return '1376405450';
    return this.tg.initDataUnsafe?.user?.id;
  }

  //метод работает только если webapp приложение было запущено при помощи встроенной keyboard (кнопка "отправить сообщение" внизу)
  sendData(data: Object) {
    this.tg.sendData(JSON.stringify(data));
  }

  //Делаем POST по публичной сылке с webHook на бота
  sendToGoogleAppsScript(data: Object): Observable<any> {
    console.log('Try POST to GAS');
    return this._http.post(this.url, data, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  getCartFromGoogleAppsScript(chat_id: string): Observable<any> {
    console.log('Try GET Cart from GAS by chat_id: ' + chat_id);
    return this._http.get(this.url + '?action=getCart&chat_id=' + chat_id, {
      responseType: 'text',
    });
  }

  getDeliveryFromGoogleAppsScript(): Observable<any> {
    console.log('Try GET Delivery from GAS');
    return this._http.get(this.url + '?action=getDelivery', {
      responseType: 'text',
    });
  }

  showAlert(msg: string) {
    this.tg.showAlert(msg);
  }

  ready() {
    this.tg.ready();
    this.tg.expand();
    //   if (this.tg.initDataUnsafe?.user?.id){
    //   // if (!environment.production)
    //     this.updateId("1376405452");
    //   // else
    //   // this.updateId(this.tg.initDataUnsafe?.user?.id);
    // }
  }
}
