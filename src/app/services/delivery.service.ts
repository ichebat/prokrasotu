import { Injectable, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface IDelivery {
  id: number;
  name: string;
  description: string;
  amount: number;
  freeAmount: number;
  isActive: boolean;
  isAddressRequired: boolean;
  dadataFilter: string;
  clientMessage: string;
}

export class DeliveryClass implements IDelivery {
  id: number = 0;
  name: string = '';
  description: string = '';
  amount: number = 0;
  freeAmount: number = 0;
  isActive: boolean = true;
  isAddressRequired: boolean = true;
  dadataFilter: string = '';
  clientMessage: string = '';

  constructor(obj) {
    for (var prop in obj) this[prop] = obj[prop];
  }
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {

  urlDelivery = environment.getDeliveryFromGoogleAsJSONUrl;

  private $deliveryAPI = toSignal<IDelivery[]>(this.getDelivery());

  $delivery = computed(() => {
    const deliveryAPIValue = this.$deliveryAPI();
    //const orderIdValue = this.$orderId();
    //console.log(deliveryAPIValue);

    if (deliveryAPIValue == undefined) {
      return [] as IDelivery[];
    } else {
      return deliveryAPIValue;
    }
  });


  constructor(private _http: HttpClient,) { }

  getDelivery(): Observable<IDelivery[]> {
    console.log('Start get delivery');
    return this._http.get(this.urlDelivery, { responseType: 'text' }).pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res.substring(47, res.length - 2));
        //console.log(gsDataJSON);
        return gsDataJSON.table.rows.map(function (row: any): IDelivery {
          //console.log(row.c[5] ? row.c[5].v : '');
          // console.log(row.c[8].v);
          // console.log(row.c[6].v.toString()=='1' ? true : false);
          return {
            id: row.c[0] ? row.c[0].v : '',
            name: row.c[1] ? row.c[1].v : '',
            description: row.c[2] ? row.c[2].v : '',
            amount: row.c[3] ? row.c[3].v : '',
            freeAmount: row.c[4] ? row.c[4].v : '',
            dadataFilter: row.c[5] ? row.c[5].v : '',
            isActive: row.c[6] ? row.c[6].v.toString() == '1' : false,
            isAddressRequired: row.c[7] ? row.c[7].v.toString() == '1' : false,
            clientMessage: row.c[8] ? row.c[8].v : '',
          };
        });
      }),
    );
  }
}
