import { Injectable, inject, signal} from '@angular/core';
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
  telegram = inject(TelegramService);

  url = environment.sendDataToTelegramUrl;

  private $deliveryAPI = toSignal<IDelivery[]>(this.getDelivery());

  $delivery = signal<IDelivery[]>([]);
  

  constructor(private _http: HttpClient) { }

  getDelivery(): Observable<IDelivery[]> {
    return this.telegram.getDeliveryFromGoogleAppsScript().pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res);
        // console.log('chat_id: ' + chat_id);
        // console.log(res);
         console.log(gsDataJSON);
        //gsDataJSON = JSON.parse(gsDataJSON);
        // console.log(gsDataJSON);

        this.$delivery.set(gsDataJSON);  
        return gsDataJSON;
      }),
    );
    
  }
}
