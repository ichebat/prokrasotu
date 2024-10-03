import { Injectable, computed, inject, signal } from '@angular/core';
import { IProduct, IProductAttribute, ProductAttributeClass, ProductClass, ProductDetailClass } from './products.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { TelegramService } from './telegram.service';
import { BehaviorSubject, Observable, Subject, map, switchMap , of, catchError, tap} from 'rxjs';
import { IOrder } from './order.service';
import { environment } from '../../environments/environment';

export interface ICartItem {
  product: IProduct;
  attribute: IProductAttribute | null;
  quantity: number;
  checked: boolean;
}

export class CartItemClass implements ICartItem {
  product: IProduct = new ProductClass(null);
  attribute: IProductAttribute | null = null;
  quantity: number = 0;
  checked: boolean = false;
  
  constructor(obj) {
    for (var prop in obj) this[prop] = obj[prop];
  }
}

export interface IShoppingCart {
  items: ICartItem[];
  totalAmount: number;
  totalCount: number;
}

export class ShoppingCartClass implements IShoppingCart {
  items: ICartItem[] = [] as CartItemClass[];
  totalAmount: number = 0;
  totalCount: number = 0;
  
  constructor(obj) {
    for (var prop in obj) this[prop] = obj[prop];
  }
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  telegram = inject(TelegramService);

  private $shoppingCartAPI = toSignal<IShoppingCart>(
    this.getCart(this.telegram.Id),
    {
      initialValue: null,
    },
  );

  $cart = signal<IShoppingCart>({
    items: [] as ICartItem[],
    totalAmount: this.calculateTotalAmount([] as ICartItem[]),
    totalCount: this.calculateTotalCount([] as ICartItem[]),
  });

  public calculateTotalAmount(items: ICartItem[]): number {
    return items.reduce(
      (total, item) =>
        total +
        ((((item.attribute && item.attribute.price>0)?(item.attribute.price):(item.product.price)) * (100 - item.product.discount)) / 100) *
          item.quantity,
      0,
    );
  }

  public calculateTotalCount(items: ICartItem[]): number {
    return items.reduce((count, item) => count + item.quantity, 0);
  }

  public checkMaxCartItemPosition(item: ICartItem):boolean{
    let existingItem = this.$cart().items.find(
      (i) => i.product.id === item.product.id,
    );

    if (!this.telegram.isAdmin)
      {
        //ограничения на количество единиц одного товара в корзине
        if(existingItem && existingItem.quantity >= environment.maxCartItemPosition && environment.maxCartItemPosition>0) return true;        
      }

    return false;
  }

  public checkMaxCartItems(item: ICartItem):boolean{
    let existingItem = this.$cart().items.find(
      (i) => i.product.id === item.product.id,
    );

    if (!this.telegram.isAdmin)
      {
        //ограничения на количество разного товара в корзине
        if(!existingItem && this.$cart().items.length >= environment.maxCartItems && environment.maxCartItems>0) return true;
      }

    return false;
  }

  addItem(cartItem: ICartItem) {

    var item = JSON.parse(JSON.stringify(cartItem)) as ICartItem;
    item.product.detail = new ProductDetailClass(null); //чтобы не гонять лишнюю информацию по сети
    
    this.$cart.update((currentCart) => {
      let existingItem = currentCart.items.find(
        (i) => (i.product.id === item.product.id && ((i.attribute == null)||(i.attribute.description == item.attribute?.description))),
      );

      if (!this.telegram.isAdmin)
      {
        //ограничения на количество единиц одного товара в корзине
        if(existingItem && existingItem.quantity+item.quantity > environment.maxCartItemPosition && environment.maxCartItemPosition>0) return currentCart;
        if(!existingItem && item.quantity > environment.maxCartItemPosition && environment.maxCartItemPosition>0) item.quantity = environment.maxCartItemPosition;

        //ограничения на количество разного товара в корзине
        if(!existingItem && currentCart.items.length >= environment.maxCartItems && environment.maxCartItems>0) return currentCart;
      }

      if (existingItem) {
        
        existingItem.quantity += item.quantity;
      } else {
        currentCart.items.push(item);
      }
      currentCart.totalAmount +=
        ((item.product.price * (100 - item.product.discount)) / 100) *
        item.quantity;

      currentCart.totalCount += item.quantity;

      
      if (this.telegram.Id) {
        this.sendCartToGoogleAppsScript(
          this.telegram.Id,
          this.telegram.UserName,
          'addCart',
          currentCart,
        ).subscribe(
          {
            next: (data)=>{
              console.log('addCart data',data)
            },
            error: (err)=>{
              console.log('addCart error',err);
            },
            complete:()=>{
              console.log('addCart complete');
            }
          }
        );;
      }
      return currentCart;
    });
  }

  removeItem(cartItem: ICartItem) {

    var item = JSON.parse(JSON.stringify(cartItem)) as ICartItem;
    item.product.detail = new ProductDetailClass(null); //чтобы не гонять лишнюю информацию по сети

    this.$cart.update((currentCart) => {
      let existingItem = currentCart.items.find(
        (i) => i.product.id === item.product.id,
      );
      if (!existingItem)
      { 
        return currentCart;
      }
      
      if (existingItem.quantity - item.quantity <= 0) {
        item.quantity = existingItem.quantity;
      }
      existingItem.quantity -= item.quantity;      

      currentCart.totalAmount -=
        ((existingItem.product.price * (100 - existingItem.product.discount)) / 100) *
        item.quantity;

      currentCart.totalCount -= item.quantity;

      currentCart.items = currentCart.items.filter((p) => p.quantity > 0);

      //console.log(currentCart.items);

      if (this.telegram.Id) {
        this.sendCartToGoogleAppsScript(
          this.telegram.Id,
          this.telegram.UserName,
          'removeCart',
          currentCart,
        ).subscribe(
          {
            next: (data)=>{
              console.log('removeCart data',data)
            },
            error: (err)=>{
              console.log('removeCart error',err);
            },
            complete:()=>{
              console.log('removeCart complete');
            }
          }
        );
      }
      return currentCart;
    });
  }

  public sendCartToGoogleAppsScript(
    chat_id: string,
    userName: string,
    actionName: string,
    shoppingCart: IShoppingCart,
  ) : Observable<any>
  {
    return this.telegram
      .sendToGoogleAppsScript({
        chat_id: chat_id,
        userName: userName,
        action: actionName,
        cart: shoppingCart,
      });
  }

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


  private getCart(chat_id: string): Observable<IShoppingCart> {
    if (!chat_id) return of<IShoppingCart>();
    return this.telegram.getCartFromGoogleAppsScript(chat_id).pipe(
      map((res: any) => {
        //console.log(res);
        let gsDataJSON = JSON.parse(res);
        // console.log('chat_id: ' + chat_id);
        
         
        if (gsDataJSON) gsDataJSON = JSON.parse(gsDataJSON);
        // console.log(gsDataJSON);

        this.$cart.set(new ShoppingCartClass(gsDataJSON));
        return new ShoppingCartClass(gsDataJSON);
      }),
      catchError(this.handleError<IShoppingCart>('getCart', {
        items:[] as ICartItem[],
        totalAmount: 0,
        totalCount: 0
      }))
    );
  }

  // removeItem(productId: string) {
  //   this.$cart.update((currentCart) => {
  //     const item = currentCart.items.find((i) => i.product.id === productId);
  //     if (item) {
  //       //убирает полностью из корзины
  //       currentCart.totalAmount -= ((item.product.price * (100 - item.product.discount)) / 100) * item.quantity;
  //       currentCart.totalCount -= item.quantity;

  //       currentCart.items = currentCart.items.filter(
  //         (i) => i.product.id !== productId,
  //       );
  //     }

  //     if (this.telegram.Id) {
  //       this.sendCartToGoogleAppsScript(
  //         this.telegram.Id,
  //         this.telegram.UserName,
  //         'removeCart',
  //         currentCart,
  //       );
  //     }

  //     return currentCart;
  //   });
  // }

  constructor() {}
}
