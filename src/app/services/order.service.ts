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
  id: number;
  items: ICartItem[];
  totalAmount: number;
  totalCount: number;
  clientName: string;
  clientTgName: string;
  clientPhone: string;
  clientAddress: string;
  delivery: IDelivery;
  orderDate: Date;
  isAccepted: boolean;
  acceptDate: Date;
  isCompleted: boolean;
  completeDate: Date;
  isDeclined: boolean;
  declineDate: Date;
  declineReason: string;
  isCorrected: boolean;
  correctionDate: Date;
  coorectionReason: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  sheetId = environment.sheetId;
  sheetGid = environment.sheetDeliveryGid;
  urlDelivery = environment.getDeliveryFromGoogleAsJSONUrl;

  telegram = inject(TelegramService);

  url = environment.sendDataToTelegramUrl;

  private $deliveryAPI = toSignal<IDelivery[]>(this.getDelivery());

  private $ordersAPI = toSignal<IOrder[]>(
    this.getOrders(this.telegram.Id),
    {
      initialValue: null,
    },
  );

  
  private $orderId = signal<string>('');

  //выбранный заказ при переходе по маршруту /order/:id
  $order = computed(() => {
    const ordersAPIValue = this.$ordersAPI();
    const orderIdValue = this.$orderId();
    if (ordersAPIValue == undefined) {
      return null;
    } else {
      return ordersAPIValue.find((p) => {
        return (
          p.id.toString().toLowerCase() ===
          orderIdValue.toString().toLowerCase()
        );
      });
    }
  });


  
  $delivery = computed(() => {
    const deliveryAPIValue = this.$deliveryAPI();

    if (deliveryAPIValue == undefined) {
      return [] as IDelivery[];
    } else {
      return deliveryAPIValue;
    }
  });

  //Заказ при передаче в компонент
  $orderSignal = signal<IOrder>({
    id: 0,
    items: [] as ICartItem[],
    totalAmount: this.calculateTotalAmount([] as ICartItem[]),
    totalCount: this.calculateTotalCount([] as ICartItem[]),
    clientName: "",
    clientTgName: "",
    clientPhone: "",
    clientAddress: "",
    delivery: {id: 0, name: "", description: "", amount: 0, freeAmount: 0},
    orderDate: new Date(),
  });

  $orders = computed(() => {
    const ordersAPIValue = this.$ordersAPI();
    
    if (ordersAPIValue == undefined) {
      return [] as IOrder[];
    } else {
      return ordersAPIValue.filter((p) => {
        return (
          true
        );
      });
    }
  });

  private calculateTotalAmount(items: ICartItem[]): number {
    return items.reduce(
      (total, item) =>
        total +
        ((item.product.price * (100 - item.product.discount)) / 100) *
          item.quantity,
      0,
    );
  }

  private calculateTotalCount(items: ICartItem[]): number {
    return items.reduce((count, item) => count + item.quantity, 0, );
  }

  addItem(item: ICartItem) {
    // this.$order.update((currentCart) => {
    //   const existingItem = currentCart.items.find(
    //     (i) => i.product.id === item.product.id,
    //   );
    //   if (existingItem) {
    //     existingItem.quantity += item.quantity;
    //   } else {
    //     currentCart.items.push(item);
    //   }
    //   currentCart.totalAmount +=
    //     ((item.product.price * (100 - item.product.discount)) / 100) *
    //     item.quantity;

    //   currentCart.totalCount += item.quantity;

    //   // if (this.telegram.Id) {
    //   //   this.sendCartToGoogleAppsScript(
    //   //     this.telegram.Id,
    //   //     this.telegram.UserName,
    //   //     'addCart',
    //   //     currentCart,
    //   //   );
    //   // }
    //   return currentCart;
    // });
  }

  removeItem(item: ICartItem) {
    // this.$order.update((currentCart) => {
    //   const existingItem = currentCart.items.find(
    //     (i) => i.product.id === item.product.id,
    //   );
    //   if (existingItem) {
    //     if (existingItem.quantity - item.quantity < 0) {item.quantity = existingItem.quantity;}
    //     existingItem.quantity -= item.quantity;
    //   } 
    //   currentCart.totalAmount -=
    //     ((item.product.price * (100 - item.product.discount)) / 100) *
    //     item.quantity;

    //   currentCart.totalCount -= item.quantity;

    //   currentCart.items = currentCart.items.filter(p => p.quantity>0);

    //   // if (this.telegram.Id) {
    //   //   this.sendCartToGoogleAppsScript(
    //   //     this.telegram.Id,
    //   //     this.telegram.UserName,
    //   //     'removeCart',
    //   //     currentCart,
    //   //   );
    //   // }
    //   return currentCart;
    // });
  }
  

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


  getOrders(chat_id:string): Observable<IOrder[]> {
    
    return this.telegram.getOrdersFromGoogleAppsScript(chat_id).pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res);
        // console.log('chat_id: ' + chat_id);
        // console.log(res);
        // console.log(gsDataJSON);
        gsDataJSON = JSON.parse(gsDataJSON);
        // console.log(gsDataJSON);

        //this.$orders.set(gsDataJSON);  
        return gsDataJSON;
      }),
    );
    
  }
  // private sendOrderToGoogleAppsScript(
  //   chat_id: string,
  //   userName: string,
  //   actionName: string,
  //   shoppingCart: IShoppingCart,
  // ) {
  //   this.telegram
  //     .sendToGoogleAppsScript({
  //       chat_id: chat_id,
  //       userName: userName,
  //       action: actionName,
  //       cart: shoppingCart,
  //     })
  //     .subscribe((response) => {
  //       console.log('SUCCESS');
  //     });
  // }

  updateId(id) {
    this.$orderId.set(id);
  }

  
}
