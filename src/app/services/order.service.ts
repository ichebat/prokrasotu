import { Injectable, computed, inject, signal} from '@angular/core';
import { ICartItem } from './cart.service';
import { TelegramService } from './telegram.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';

export interface IDelivery {
  id: number;
  name: string;
  description: string;
  amount: number;
  freeAmount: number;
}

export interface IOrder {
  items: ICartItem[];
  clientName: string;
  clientTgName: string;
  clientPhone: string;
  clientAddress: string;
  delivery: IDelivery;
  totalAmount: number;
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  sheetId = environment.sheetId;//'1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI';
  sheetGid = environment.sheetDeliveryGid;//'1383014775';
  urlDelivery = environment.getDeliveryFromGoogleAsJSONUrl;

  telegram = inject(TelegramService);

  url = environment.sendDataToTelegramUrl;

  private $deliveryAPI = toSignal<IDelivery[]>(this.getDelivery());

  //$delivery = signal<IDelivery[]>([]);
  //получаем список доставки
  $delivery = computed(() => {
    const deliveryAPIValue = this.$deliveryAPI();

    if (deliveryAPIValue == undefined) {
      return [] as IDelivery[];
    } else {
      return deliveryAPIValue;
    }
  });
  

  constructor(private _http: HttpClient) { }

  // getDelivery(): Observable<IDelivery[]> {
  //   return this.telegram.getDeliveryFromGoogleAppsScript().pipe(
  //     map((res: any) => {
  //       let gsDataJSON = JSON.parse(res);
  //       // console.log('chat_id: ' + chat_id);
  //       // console.log(res);
  //        console.log(gsDataJSON);
  //       //gsDataJSON = JSON.parse(gsDataJSON);
  //       // console.log(gsDataJSON);

  //       this.$delivery.set(gsDataJSON);  
  //       return gsDataJSON;
  //     }),
  //   );
    
  // }

  getDelivery(): Observable<IDelivery[]> {
    console.log('Start get delivery');
    return this._http.get(this.urlDelivery, { responseType: 'text' }).pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res.substring(47, res.length - 2));
        //console.log(gsDataJSON);
        return gsDataJSON.table.rows.map(function (row: any): IDelivery {
          return {
            id: row.c[0] ? row.c[0].v : '',
            name: row.c[1] ? row.c[1].v : '',
            description: row.c[2] ? row.c[2].v : '',
            amount: row.c[3] ? row.c[3].v : '',
            freeAmount: row.c[4] ? row.c[4].v : '',
          };
        });
      }),
    );
    
  }

  
}
