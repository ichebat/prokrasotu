import { Injectable, computed, inject, signal } from '@angular/core';
import { IProduct } from './products.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { TelegramService } from './telegram.service';
import { BehaviorSubject, Observable, Subject, map, switchMap } from 'rxjs';

export interface ICartItem {
  product: IProduct;
  quantity: number;
}

export interface IShoppingCart {
  items: ICartItem[];
  totalAmount: number;
  totalCount: number;
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
    this.$cart.update((currentCart) => {
      const existingItem = currentCart.items.find(
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
        );
      }
      return currentCart;
    });
  }

  removeItem(item: ICartItem) {
    this.$cart.update((currentCart) => {
      const existingItem = currentCart.items.find(
        (i) => i.product.id === item.product.id,
      );
      if (existingItem) {
        if (existingItem.quantity - item.quantity < 0) {item.quantity = existingItem.quantity;}
        existingItem.quantity -= item.quantity;
      } 
      currentCart.totalAmount -=
        ((item.product.price * (100 - item.product.discount)) / 100) *
        item.quantity;

      currentCart.totalCount -= item.quantity;

      currentCart.items = currentCart.items.filter(p => p.quantity>0);

      if (this.telegram.Id) {
        this.sendCartToGoogleAppsScript(
          this.telegram.Id,
          this.telegram.UserName,
          'removeCart',
          currentCart,
        );
      }
      return currentCart;
    });
  }

  private sendCartToGoogleAppsScript(
    chat_id: string,
    userName: string,
    actionName: string,
    shoppingCart: IShoppingCart,
  ) {
    this.telegram
      .sendToGoogleAppsScript({
        chat_id: chat_id,
        userName: userName,
        action: actionName,
        cart: shoppingCart,
      })
      .subscribe((response) => {
        console.log('SUCCESS');
      });
  }

  private getCart(chat_id: string): Observable<IShoppingCart> {
    return this.telegram.getCartFromGoogleAppsScript(chat_id).pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res);
        // console.log('chat_id: ' + chat_id);
        // console.log(res);
        // console.log(gsDataJSON);
        gsDataJSON = JSON.parse(gsDataJSON);
        // console.log(gsDataJSON);

        this.$cart.set(gsDataJSON);  
        return gsDataJSON;
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
