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
}

@Injectable({
  providedIn: 'root',
})
export class TelegramService {
  private window;
  tg;
  private url = environment.sendDataToTelegramUrl;
  public isRedirectedByStartParam; //проверяем считывался ли стартовый маршрут при запуске webAPp через DirectLink, чтобы роутинг был только первый раз

  constructor(
    @Inject(DOCUMENT) private _document,
    private _http: HttpClient,
  ) {
    this.window = this._document.defaultView;
    this.tg = this.window.Telegram.WebApp;
    this.isRedirectedByStartParam = false;
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
    //if (!environment.production) return '';
    if (!environment.production) return 'chebatz';
    const username = this.tg.initDataUnsafe?.user?.username;
    return (!username)?(""):(username);
  }

  get FIO(): string {
    //if (!environment.production) return '';
    //if (!environment.production) return 'Чеботарев Иван';
    const lastName = this.tg.initDataUnsafe?.user?.last_name;
    const firstName = this.tg.initDataUnsafe?.user?.firstName;
    return ((!firstName)?(""):(firstName)+(!lastName )?(""):(" "+lastName)).trim();
  }

  get Id(): string {
    //if (!environment.production) return '619864883';
    //if (!environment.production) return '1628082195';
    if (!environment.production) return '1376405450';
    
    const id = this.tg.initDataUnsafe?.user?.id;
    return (!id)?(""):(id);
  }

  get isAdmin(): boolean{
    let flag: boolean = false;

    environment.masterUserName.split(";").forEach(p=>{
      if (p.toString().toLowerCase()==this.UserName.toString().toLowerCase()) flag = true;
    })

    environment.masterChatId.split(";").forEach(p=>{
      if (p==this.Id) flag = true;
    })
    //console.log("isadmin: "+flag);
    //return this.UserName == environment.masterUserName || this.Id == environment.masterChatId
    return flag;
  }

  get IsTelegramWebAppOpened(): boolean {
    if (!environment.production) return false;
    //if (!environment.production) return true;
    if (!this.FIO && !this.Id && !this.UserName) return false;
    return true;
  }

  get StartParam(): string {

    let start_param = ((!this.isRedirectedByStartParam)?(this.tg.initDataUnsafe?.start_param):(""));
    //if (!environment.production) start_param = ((!this.isRedirectedByStartParam)?('product_9_gel-dlya-britya-estel-alpha-pro'):(""));    
    
    if (start_param) start_param = start_param.replaceAll('_','/');
    if (start_param && start_param.indexOf('/')>0) start_param = '/'+start_param;

    if (!start_param) this.isRedirectedByStartParam = true;
    
    //console.log("this.isStartParamLoaded: "+this.isRedirectedByStartParam+" "+start_param);
    return (!start_param)?(""):(start_param);
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

  getOrdersFromGoogleAppsScript(chat_id: string): Observable<any> {
    console.log('Try GET Orders from GAS by chat_id: ' + chat_id);
    return this._http.get(this.url + '?action=getOrders&chat_id=' + chat_id, {
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
