import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TelegramService } from './telegram.service';

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

  deliveryResponseChanged = new BehaviorSubject<void>(undefined);
  //private $deliveryAPI = toSignal<IDelivery[]>(this.getDelivery());
  private $deliveryAPI = toSignal<IDelivery[]>(
    this.deliveryResponseChanged.pipe(
      switchMap(() =>
      this.getDelivery(),
      ),
    ),
    { initialValue: null },
  );

  private $deliveryId = signal<string>('');  
  public $action = signal<string>('');

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

  $maxId = computed(() => {
    const deliveryAPIValue = this.$deliveryAPI();
    if (deliveryAPIValue == undefined) {
      return 0;
    } else {
      let result = 0;
      deliveryAPIValue.forEach(p=>{
        if(p.id>result) result = p.id;
      });
      return result;
    }
  });

  //выбранная доставка при переходе по маршруту /delivery/:id используется для редактирования
  $deliveryItem = computed(() => {
    const deliveryAPIValue = this.$deliveryAPI();
    const deliveryIdValue = this.$deliveryId();
    if (deliveryAPIValue == undefined) {
      return null;
    } else 
    {
      if (!deliveryIdValue || parseInt(deliveryIdValue) <= 0 || deliveryIdValue.toLowerCase() == 'new') {
        return {
          id: 0,
          name: '',
          description: '',
          amount: 0,
          freeAmount: 0,
          isActive: false,
          isAddressRequired: false,
          dadataFilter: '',
          clientMessage: '',          
        };
      } else {
        //console.log('deliveryIdValue',deliveryIdValue);
        return deliveryAPIValue.find((p) => {
          return (
            p.id.toString().toLowerCase() ===
            deliveryIdValue.toString().toLowerCase()
          );
        }) as DeliveryClass;
      }
    }
  });


  telegram = inject(TelegramService);

  constructor(private _http: HttpClient,) { }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
  
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead
  
      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);
  
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }


  getDelivery(): Observable<IDelivery[]> {
    console.log('Start get delivery');
    return this._http.get(this.urlDelivery, { responseType: 'text' }).pipe(
      map((res: any) => {
        //console.log(res);
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
            //isActive: row.c[6] ? row.c[6].v.toString() == '1' : false,
            isActive: (row.c[6] && row.c[6].v === true)?true:false,
            isAddressRequired: (row.c[7] && row.c[7].v === true)?true:false,
            //isAddressRequired: row.c[7] ? row.c[7].v.toString() == '1' : false,
            clientMessage: row.c[8] ? row.c[8].v : '',
          };
        });
      }),
      catchError(this.handleError<IDelivery[]>('getDelivery', []))
    );
  }

  updateId(id) {
    this.$deliveryId.set(id);
  }

  updateDeliveryApi() {
    this.deliveryResponseChanged.next();
  }

  public sendDeliveryToGoogleAppsScript(
    chat_id: string,
    userName: string,
    actionName: string,
    delivery: IDelivery,
  ): Observable<any> {
    //console.log(delivery);
    let tempDelivery = structuredClone(delivery);
    
    return this.telegram.sendToGoogleAppsScript({
      chat_id: chat_id,
      userName: userName,
      action: actionName,
      delivery: tempDelivery,
    });
  }
}
