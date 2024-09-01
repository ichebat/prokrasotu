import { Injectable, computed, inject, signal } from '@angular/core';
import { IProduct, ProductClass } from './products.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { TelegramService } from './telegram.service';
import { BehaviorSubject, Observable, Subject, map, switchMap , of} from 'rxjs';
import { IOrder } from './order.service';

export interface ICartItem {
  product: IProduct;
  quantity: number;
  checked: boolean;
}

export class CartItemClass implements ICartItem {
  product: IProduct = new ProductClass(null);
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
        ((item.product.price * (100 - item.product.discount)) / 100) *
          item.quantity,
      0,
    );
  }

  public calculateTotalCount(items: ICartItem[]): number {
    return items.reduce((count, item) => count + item.quantity, 0);
  }

  addItem(item: ICartItem) {
    this.$cart.update((currentCart) => {
      let existingItem = currentCart.items.find(
        (i) => i.product.id === item.product.id,
      );
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

  removeItem(item: ICartItem) {
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

  

  private getCart(chat_id: string): Observable<IShoppingCart> {
    if (!chat_id) return of<IShoppingCart>();
    return this.telegram.getCartFromGoogleAppsScript(chat_id).pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res);
        // console.log('chat_id: ' + chat_id);
        // console.log(res);
        // console.log(gsDataJSON);
        gsDataJSON = JSON.parse(gsDataJSON);
        // console.log(gsDataJSON);

        this.$cart.set(new ShoppingCartClass(gsDataJSON));
        return new ShoppingCartClass(gsDataJSON);
      }),
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
