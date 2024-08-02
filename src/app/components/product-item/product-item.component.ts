import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  effect,
  signal,
} from '@angular/core';
import { IProduct } from '../../services/products.service';
import { CartService, ICartItem } from '../../services/cart.service';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.scss',
})
export class ProductItemComponent implements OnInit, OnDestroy {
  @Input() product!: IProduct;

  // cartItems = this.cartService.$cart().items;
  // totalAmount = this.cartService.$cart().totalAmount;
  //quantity = 0;//this.cartService.$cart().items.find(p=>p.product.id === this.product.id)?.quantity;
  //isInCart = this.cartItems.findIndex(p=>p.product.id === this.product!.id)>=0;
  
  private $isInCartSignal = signal<boolean>(false);
  private $quantitySignal = signal<number>(0);
  // private $quantitySignal = signal<number>(0);

  $isInCart = computed(() => {
    const isInCartSignalValue = this.$isInCartSignal();
    const quantitySignalValue = this.$quantitySignal();
    const cartItemsValue = this.cartService.$cart().items;
    
    if (cartItemsValue == undefined) {
      return false;
    } else {
      return (
        cartItemsValue.findIndex((p) => p.product.id === this.product.id) >= 0
      );
    }
  });

  $quantity = computed(() => {
    const quantitySignalValue = this.$quantitySignal();
    const isInCartSignalValue = this.$isInCartSignal();
    const cartItemsValue = this.cartService.$cart().items;
    if (cartItemsValue == undefined) {
      return 0;
    } else 
    // if (quantitySignalValue == undefined) {
    //   return 0;
    // } else
    {
      return cartItemsValue.find((p) => p.product.id === this.product.id)?.quantity
    }
  });

  // $quantity  = computed(() => {
  //   const quantitySignalValue = this.$quantitySignal();
  //   const cartItemsValue = this.cartService.$cart().items;
  //   if (cartItemsValue == undefined || !cartItemsValue.find((p) => p.product.id === this.product.id)) {
  //     return 0;
  //   } else {
  //     //console.log(cartItemsValue.find((p) => p.product.id === this.product.id)?.quantity);
  //     return (
  //       cartItemsValue.find((p) => p.product.id === this.product.id)?.quantity
  //     );
  //   }
  // });

  

  /**
   *
   */
  constructor(
    private cartService: CartService,
    private telegramService: TelegramService,
  ) {
    // this.sendData = this.sendData.bind(this);

    // const sendDataToTelegram = () => {
    //   //this.telegramService.sendToGoogleAppsScript(this.product);
    //   this.sendData();
    // }
  
    // effect(()=>{
    //   this.telegramService.tg.onEvent('mainButtonClicked', sendDataToTelegram);
    //   return () =>{
    //     this.telegramService.tg.offEvent('mainButtonClicked', sendDataToTelegram);
    //   }
    // });

    
  }

  

  // incQuantity() {
  //   // this.$quantitySignal.set(this.$quantitySignal()+1);
  //   if (!this.$quantitySignal()) this.$quantitySignal.set(1);
  //   else
  //   this.$quantitySignal.set(this.$quantitySignal()+1);

  //   //this.$isInCartSignal.set(true);
  // }

  // decQuantity() {
  //   if (!this.$quantitySignal()) this.$quantitySignal.set(1);
  //   //if (this.$quantitySignal() == 1) this.$isInCartSignal.set(false);
  //   if (this.$quantitySignal() > 0) this.$quantitySignal.set(this.$quantitySignal()-1);  
    
  // }

  // addItem() {
  //   console.log('Add to cart');
  //   // console.log(this.$quantitySignal());
  //   this.incQuantity();
  //   // console.log(this.$quantitySignal());
  //   // fixed added product
  //   const newItem: ICartItem = {
  //     product: this.product,
  //     quantity: 1,
  //   };
  //   this.cartService.addItem(newItem);
  //   this.udpateCart();
    
  // }

  // removeItem() {
  //   console.log('Remove from cart');
  //   this.decQuantity();
  //   const newItem: ICartItem = {
  //     product: this.product,
  //     quantity: 1,
  //   };

  //   this.cartService.removeItem(newItem);
  //   this.udpateCart();
  // }

  // udpateCart() {
    
  //   // Update cartItems and totalAmount after removing an item
  //   // this.cartItems = this.cartService.$cart().items;
  //   // this.totalAmount = this.cartService.$cart().totalAmount;
  //    //this.$isInCartSignal.set(this.cartService.$cart().items.findIndex(p=>p.product.id === this.product.id)>=0); // = this.cartItems.findIndex(p=>p.product.id === this.product.id)>=0;
    
  //   // if (this.$isInCartSignal()) this.$quantitySignal.set(this.cartItems.find(p=>p.product.id === this.product.id)?.quantity!);
  //   // else
  //   // this.$quantitySignal.set(0);
  // }

  

  ngOnInit(): void {
    //this.telegramService.MainButton.setText('Отправить заказ в PROКРАСОТУ');
    // this.telegramService.MainButton.show();
    // this.telegramService.MainButton.disable();
    //this.telegramService.MainButton.show();
    // let f = () => this.sendData;
    // this.telegramService.MainButton.onClick(f);

    

    //this.telegramService.MainButton.onClick(this.sendData);
    
  }

  ngOnDestroy(): void {
    // let f = () => this.sendData;
    // this.telegramService.MainButton.offClick(f);
    //this.telegramService.MainButton.offClick(this.sendData); //при передаче параметра this теряется, поэтому забандить его в конструкторе
    //this.telegramService.MainButton.onEvent('mainButtonClicked', ()=>{});
  }

  // sendData() {
  //   // this.telegramService.sendToGoogleAppsScript({ feedback: '123456' }).subscribe({
  //   //     next: data => {
  //   //         //this.postId = data.id;
  //   //         console.log("SUCCESS POST")
  //   //     },
  //   //     error: error => {
  //   //         //this.errorMessage = error.message;
  //   //         console.error('There was an error!', error);
  //   //     }
  //   // })

  //   //this.telegramService.showAlert('123');

  //   //this.telegramService.MainButton.setText('Отправляем заказ в ProKrasotu');
  //   //this.telegramService.MainButton.disable();
    
  //   this.telegramService.sendToGoogleAppsScript({"newOrder":this.product}).subscribe(response => {
  //     console.log("SUCCESS");
  //     this.telegramService.MainButton.setText('Ваш заказ отправлен в ProKrasotu');
  //     //this.telegramService.MainButton.enable();
  //     // setTimeout(() => {
  //     //   this.telegramService.tg.close();
  //     // }, 5000);
  //   });

    
    
  // }

  isInCart(product:IProduct)
  {
    return this.cartService.$cart().items.findIndex(p=>p.product.id === product.id)>=0;
  }

  quantityInCart(product:IProduct)
  {
    return this.cartService.$cart().items.find(p=>p.product.id === product.id)!.quantity;
  }

  addItem() {
    console.log('Add to cart');
    
    const newItem: ICartItem = {
      product: this.product,
      quantity: 1,
      checked: true,
    };
    this.cartService.addItem(newItem);
    
    
  }

  removeItem() {
    console.log('Remove from cart');
    
    const newItem: ICartItem = {
      product: this.product,
      quantity: 1,
      checked: true,
    };

    this.cartService.removeItem(newItem);
    
  }

  //https://api.telegram.org/bot[TOKEN]/sendMessage?chat_id=[CHAT_ID]&text=[TEXT]&reply_markup={"inline_keyboard": [[{"text": "hi", "callback_data": "hi"}]]}
  //https://stackoverflow.com/questions/70997956/how-to-send-a-message-via-url-with-inline-buttons
}
