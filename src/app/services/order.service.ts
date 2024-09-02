import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItemClass, CartService, ICartItem } from './cart.service';
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
  isActive: boolean = false;
  isAddressRequired: boolean = false;
  dadataFilter: string = '';
  clientMessage: string = '';
  
  constructor(obj) {
    for (var prop in obj) this[prop] = obj[prop];
  }
}

export interface IOrder {
  id: number;
  items: ICartItem[];
  totalAmount: number;
  totalCount: number;
  clientName: string;
  clientTgName: string;
  clientTgChatId: string;
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

export class OrderClass implements IOrder {
  id: number = 0;
  items: ICartItem[] = [] as CartItemClass[];
  totalAmount: number = 0;
  totalCount: number = 0;
  clientName: string = '';
  clientTgName: string = '';
  clientTgChatId: string = '';
  clientPhone: string = '';
  clientAddress: string = '';
  delivery: IDelivery = new DeliveryClass(null);
  orderDate: Date = new Date();
  isAccepted: boolean = false;
  acceptDate: Date = new Date();
  isCompleted: boolean = false;
  completeDate: Date = new Date();
  isDeclined: boolean = false;
  declineDate: Date = new Date();
  declineReason: string = '';
  isCorrected: boolean = false;
  correctionDate: Date = new Date();
  correctionReason: string = '';
  description: string = '';
  
  constructor(obj) {
    for (var prop in obj) this[prop] = obj[prop];
  }
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
          clientTgChatId: this.telegram.Id,
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
            isAddressRequired: false,
            clientMessage: '',
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

  $activeOrdersCount = computed(() => {
    const ordersAPIValue = this.$ordersAPI();
    const orderIdValue = this.$orderId();

    if (ordersAPIValue == undefined) {
      return 0;
    } else 
    if (orderIdValue == undefined || parseInt(orderIdValue) > 0) {
      return 0;
    } else 
    if (parseInt(orderIdValue) <= 0){
      return ordersAPIValue.filter((p) => !p.isCompleted && !p.isDeclined).length;
    }
    else return 0;
  });

  public checkMaxOrders():boolean{
    
    if (!this.telegram.isAdmin && this.telegram.Id)
      {
        //console.log(this.$activeOrdersCount() );
        //ограничения на количество разного товара в корзине
        if(this.$activeOrdersCount() >= environment.maxOrders && environment.maxOrders>0) return true;
      }

    return false;
  }

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

  // //проверка требуется ли указывать адрес для данного вида доставки
  // isDeliveryRequired(delivery: IDelivery){
  //   let flag = true;
  //   if (!delivery || delivery == undefined) flag = false;
  //   if (delivery.id<=0) flag = false;
  //   if (delivery?.name?.toLowerCase() == "самовывоз") flag = false;

  //   return flag;
  // }

  getOrders(chat_id: string): Observable<IOrder[]> {
    // console.log('Start get orders by chat_id: '+chat_id);
    if (!chat_id) return scheduled<IOrder[]>([], asyncScheduler);
    return this.telegram.getOrdersFromGoogleAppsScript(chat_id).pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res);
        // console.log('chat_id: ' + chat_id);
        // console.log(res);
        // console.log(gsDataJSON);
        //gsDataJSON = gsDataJSON.map((p) => JSON.parse(p));
        gsDataJSON = gsDataJSON.map(function (p) {
          p = JSON.parse(p)
          p.delivery = new DeliveryClass(p.delivery);
          return new OrderClass(p);
        });

        //console.log(gsDataJSON);
        

        //  let OrdersArray = [] as OrderClass[];
        // gsDataJSON.forEach(element => {
        //   element.delivery = new DeliveryClass(element.delivery);
        //   OrdersArray.push(new OrderClass(element));
        // });

        //console.log(OrdersArray);
        //Object.assign({}, OrdersArray = gsDataJSON as OrderClass[]);
        // Object.assign(OrdersArray, gsDataJSON);
        // OrdersArray.forEach(order =>{
        //   let deliveryAPI = new DeliveryClass();
        //   Object.assign(deliveryAPI, order.delivery);
        //   Object.assign(order.delivery, deliveryAPI);
        // });

        
        // Object.assign(OrdersArray, gsDataJSON);
        

        // gsDataJSON.forEach(orderApi => {
        //   let deliveryValue = new DeliveryClass();
        //   Object.assign(deliveryValue, orderApi.delivery);
          
        //   //console.log(deliveryValue)
        //   orderApi.delivery = deliveryValue;
        // });
        // console.log(gsDataJSON);
        //gsDataJSON.delivery = deliveryValue;
        //gsDataJSON = gsDataJSON.map(p => p.delivery = JSON.parse(p.delivery))
        //gsDataJSON = JSON.parse(gsDataJSON);
        
        //this.$orders.set(gsDataJSON);
        //return gsDataJSON;
        return gsDataJSON;
      }),
    );
  }

  getOrderStatus(order: IOrder){
    
    let result = "";
    if (order.isAccepted) 
    {
      // if (!order.delivery.isAddressRequired)
      //   result = "Заказ готов к выдаче ("+order.delivery.description+"). "+new Date(order.acceptDate).toLocaleDateString();
      // else
      //   result = "Заказ направлен в доставку ("+order.delivery.description+"). "+new Date(order.acceptDate).toLocaleDateString();
      result = order.delivery.clientMessage+" "+new Date(order.acceptDate).toLocaleDateString();;
    }
    else
    if (order.isCompleted) result = "Заказ выполнен. "+new Date(order.completeDate).toLocaleDateString();
    else
    if (order.isDeclined) result = "Заказ отклонен. "+new Date(order.declineDate).toLocaleDateString()+(order.declineReason ? " Причина: "+order.declineReason:"");
    else
    //result = "Заказ в обработке ["+moment(order.acceptDate).format('DD.MM.YYYY HH:mm:ss SSS')+"]";
    result = "Заказ в обработке у продавца. "+new Date(order.orderDate).toLocaleDateString();

    //if (order.isCorrected) result += "\nЗаказ был скорректирован. "+new Date(order.correctionDate).toLocaleDateString()+"\n"+order.correctionReason ? " Причина: "+order.correctionReason:"";
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
  }

  updateOrdersApi(){
    
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
