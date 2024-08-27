import { Injectable, computed, inject, signal } from '@angular/core';
import { CartService, ICartItem } from './cart.service';
import { TelegramService } from './telegram.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, asyncScheduler, map, of, scheduled, switchMap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface IDelivery {
  id: number;
  name: string;
  description: string;
  amount: number;
  freeAmount: number;
  isActive: boolean;
  dadataFilter: string;
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
  correctionReason: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  sheetId = environment.sheetId;
  sheetGid = environment.sheetDeliveryGid;
  urlDelivery = environment.getDeliveryFromGoogleAsJSONUrl;

  telegram = inject(TelegramService);

  url = environment.sendDataToTelegramUrl;

  private $deliveryAPI = toSignal<IDelivery[]>(this.getDelivery());

  ordersResponseChanged = new BehaviorSubject<void>(undefined);
  // private $ordersAPI = toSignal<IOrder[]>(this.getOrders(this.telegram.Id), {
  //   initialValue: null,
  // });
  private $orderId = signal<string>('');

  //обновляется по выполнении this.ordersResponseChanged.next(), при выполнении updateId()
  //если $orderId не установлен, то заказы с таблицы не тянутся
  private $ordersAPI = toSignal<IOrder[]>(
    this.ordersResponseChanged.pipe(
      switchMap(() => this.$orderId() ? this.getOrders(this.telegram.Id): scheduled<IOrder[]>([], asyncScheduler))
    ),  
    { initialValue: null }
  );

  

  //выбранный заказ при переходе по маршруту /order/:id
  $order = computed(() => {
    //console.log("computed "+new Date());
    const cartValue = this.cartService.$cart();
    //const ordersAPIValue = this.$ordersAPI();
    const ordersAPIValue = this.$orders();
    const orderIdValue = this.$orderId();
    if (ordersAPIValue == undefined || cartValue == undefined) {
      return null;
    } else {
      if (!orderIdValue && cartValue) {
        return {
          id: 0,
          items: cartValue.items.filter((p) => p.checked),
          totalAmount: this.calculateTotalAmount(
            cartValue.items.filter((p) => p.checked) as ICartItem[],
          ),
          totalCount: this.calculateTotalCount(
            cartValue.items.filter((p) => p.checked) as ICartItem[],
          ),
          clientName: '',
          clientTgName: this.telegram.UserName,
          clientPhone: '',
          clientAddress: '',
          delivery: {
            id: 0,
            name: '',
            description: '',
            amount: 0,
            freeAmount: 0,
            isActive: true,
            dadataFilter: '',
          },
          orderDate: new Date(),
          isAccepted: false,
          acceptDate: new Date(),
          isCompleted: false,
          completeDate: new Date(),
          isDeclined: false,
          declineDate: new Date(),
          declineReason: '',
          isCorrected: false,
          correctionDate: new Date(),
          correctionReason: '',
          description: '',
        };
      } else {
        //console.log(ordersAPIValue);
        return ordersAPIValue.find((p) => {
          return (
            p.id.toString().toLowerCase() ===
            orderIdValue.toString().toLowerCase()
          );
        });
      }
    }
  });

  $delivery = computed(() => {
    const deliveryAPIValue = this.$deliveryAPI();
    const orderIdValue = this.$orderId();
    //console.log(deliveryAPIValue);

    if (deliveryAPIValue == undefined) {
      return [] as IDelivery[];
    } else {
      return deliveryAPIValue;
    }
  });

  $orders = computed(() => {
    const ordersAPIValue = this.$ordersAPI();

    //console.log(ordersAPIValue);

    if (ordersAPIValue == undefined) {
      return [] as IOrder[];
    } else {
      return ordersAPIValue.filter((p) => {
        return true;
      });
    }
  });

  public calculateTotalAmount(items: ICartItem[]): number {
    const amount = items.reduce(
      (total, item) =>
        total +
        ((item.product.price * (100 - item.product.discount)) / 100) *
          item.quantity,
      0,
    );
    return amount;
  }

  public calculateTotalCount(items: ICartItem[]): number {
    return items.reduce((count, item) => count + item.quantity, 0);
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
    this.cartService
      .$cart()!
      .items.find((p) => p.product.id == item.product.id)!.checked = false;

    const index = this.$order()?.items.findIndex(
      (p) => p.product.id == item.product.id,
    );
    //console.log(index);
    if (index! > -1) {
      // only splice array when item is found
      this.$order()!.items.splice(index!, 1); // 2nd parameter means remove one item only
      this.$order()!.totalAmount -=
        ((item.product.price * (100 - item.product.discount)) / 100) *
        item.quantity;

      this.$order()!.totalCount -= item.quantity;
      //console.log(this.$order()?.items);
    }

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

  constructor(
    private _http: HttpClient,
    private cartService: CartService,
  ) {}

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
          //console.log(row.c[5] ? row.c[5].v : '');
          // console.log(row.c[6].v);
          // console.log(row.c[6].v.toString()=='1' ? true : false);
          return {
            id: row.c[0] ? row.c[0].v : '',
            name: row.c[1] ? row.c[1].v : '',
            description: row.c[2] ? row.c[2].v : '',
            amount: row.c[3] ? row.c[3].v : '',
            freeAmount: row.c[4] ? row.c[4].v : '',
            dadataFilter: row.c[5] ? row.c[5].v : '',
            isActive: row.c[6] ? row.c[6].v.toString() == '1' : false,
          };
        });
      }),
    );
  }

  //проверка требуется ли указывать адрес для данного вида доставки
  isDeliveryRequired(delivery: IDelivery){
    let flag = true;
    if (!delivery) flag = false;
    if (delivery.id<=0) flag = false;
    if (delivery.name.toLowerCase() == "самовывоз") flag = false;

    return flag;
  }

  getOrders(chat_id: string): Observable<IOrder[]> {
    
    if (!chat_id) return scheduled<IOrder[]>([], asyncScheduler);
    return this.telegram.getOrdersFromGoogleAppsScript(chat_id).pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res);
        // console.log('chat_id: ' + chat_id);
        // console.log(res);
        // console.log(gsDataJSON);
        gsDataJSON = gsDataJSON.map((p) => JSON.parse(p));
        //gsDataJSON = gsDataJSON.map(p => p.delivery = JSON.parse(p.delivery))
        //gsDataJSON = JSON.parse(gsDataJSON);
        //console.log(gsDataJSON);

        //this.$orders.set(gsDataJSON);
        return gsDataJSON;
      }),
    );
  }

  getOrderStatus(order: IOrder){
    
    let result = "";
    if (order.isCompleted) result = "Заказ выполнен. "+new Date(order.completeDate).toLocaleDateString();
    else
    if (order.isDeclined) result = "Заказ отклонен. "+new Date(order.declineDate).toLocaleDateString()+"\n"+order.declineReason ? " Причина: "+order.declineReason:"";
    else    
    if (order.isAccepted) 
    {
      if (this.isDeliveryRequired(order.delivery))
        result = "Заказ готов к выдаче ("+order.delivery.description+"). "+new Date(order.acceptDate).toLocaleDateString();
      else
        result = "Заказ направлен в доставку ("+order.delivery.description+"). "+new Date(order.acceptDate).toLocaleDateString();
    }
    else
    //result = "Заказ в обработке ["+moment(order.acceptDate).format('DD.MM.YYYY HH:mm:ss SSS')+"]";
    result = "Заказ в обработке у продавца. "+new Date(order.orderDate).toLocaleDateString();

    if (order.isCorrected) result += "\nЗаказ был скорректирован. "+new Date(order.correctionDate).toLocaleDateString()+"\n"+order.correctionReason ? " Причина: "+order.correctionReason:"";
    return result;

  }

  public sendOrderToGoogleAppsScript(
    chat_id: string,
    userName: string,
    actionName: string,
    order: IOrder,
  ): Observable<any> {
    return this.telegram.sendToGoogleAppsScript({
      chat_id: chat_id,
      userName: userName,
      action: actionName,
      order: order,
    });
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

  //обновляет id для выбора текущего заказа и список последних 10 заказов с сервера
  updateId(id) {
    this.$orderId.set(id);
    this.ordersResponseChanged.next();
  }

  //поиск адреса с сервисом Дадата
  getDadataAddress(query: string, count: number) {
    const headerDict = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Token ' + environment.DADATA_API_KEY,
      'Access-Control-Allow-Origin': '*',
    };

    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };

    var body = {
      query: query,
      count: count,
    };
    return this._http.post(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      body,
      requestOptions,
    );
  }
}
