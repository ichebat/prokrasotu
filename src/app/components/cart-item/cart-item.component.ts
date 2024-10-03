import { Component, Input, OnDestroy, OnInit, effect } from '@angular/core';
import { CartService, ICartItem } from '../../services/cart.service';
import { TelegramService } from '../../services/telegram.service';
import { Location } from '@angular/common';
import { IProduct } from '../../services/products.service';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart-item',
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss'
})
export class CartItemComponent implements OnInit, OnDestroy {


  @Input() cartItem!: ICartItem;

  constructor(private location: Location,
    private cartService: CartService,
    private telegramService: TelegramService,
    public dialog: MatDialog,) {

    this.goBack = this.goBack.bind(this);

    // this.sendData = this.sendData.bind(this);

    // const sendDataToTelegram = () => {      
    //   this.sendData();
    // }
  
    // effect(()=>{
    //   this.telegramService.tg.onEvent('mainButtonClicked', sendDataToTelegram);
    //   return () =>{
    //     this.telegramService.tg.offEvent('mainButtonClicked', sendDataToTelegram);
    //   }
    // });

    
  }

  goBack() {
    this.location.back();
  }

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
    //this.telegramService.MainButton.hide();
    // let f = () => this.sendData;
    // this.telegramService.MainButton.offClick(f);
    //this.telegramService.MainButton.offClick(this.sendData); //при передаче параметра this теряется, поэтому забандить его в конструкторе
    //this.telegramService.MainButton.onEvent('mainButtonClicked', ()=>{});
  }

  sendData() {
    // this.telegramService.sendToGoogleAppsScript({ feedback: '123456' }).subscribe({
    //     next: data => {
    //         //this.postId = data.id;
    //         console.log("SUCCESS POST")
    //     },
    //     error: error => {
    //         //this.errorMessage = error.message;
    //         console.error('There was an error!', error);
    //     }
    // })

    //this.telegramService.showAlert('123');

    //this.telegramService.MainButton.setText('Отправляем заказ в ProKrasotu');
    //this.telegramService.MainButton.disable();
    
    // this.telegramService.sendToGoogleAppsScript({"newOrder":this.cart}).subscribe(response => {
    //   console.log("SUCCESS");
    //   this.telegramService.MainButton.setText('Ваш заказ отправлен в ProKrasotu');
    //   //this.telegramService.MainButton.enable();
    //   // setTimeout(() => {
    //   //   this.telegramService.tg.close();
    //   // }, 5000);
    // });

    
    
  }

  quantityInCart(product:IProduct)
  {
    return this.cartService.$cart().items.find(p=>p.product.id === product.id && p.attribute?.description == this.cartItem.attribute?.description)!.quantity;
  }

  addItem() {
    
    console.log('Add to cart');
    
    const newItem: ICartItem = {
      product: this.cartItem.product,
      attribute: this.cartItem.attribute,
      quantity: 1,
      checked: this.cartItem.checked,
    };
    if(this.cartService.checkMaxCartItemPosition(newItem))
    {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: "Достигнуто ограничение",
            description:
              'Нельзя добавить более '+environment.maxCartItemPosition.toString()+' шт. одного товара в корзину.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
          
        } else return;
      });
    }
    if(this.cartService.checkMaxCartItems(newItem))
    {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: "Достигнуто ограничение",
            description:
              'Нельзя добавить более '+environment.maxCartItems.toString()+' разных товаров в корзину.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
          
        } else return;
      });
    }
    else
    this.cartService.addItem(newItem);
    
    
  }

  removeItem() {
    console.log('Remove from cart');
    
    const newItem: ICartItem = {
      product: this.cartItem.product,
      attribute: this.cartItem.attribute,
      quantity: 1,
      checked: this.cartItem.checked,
    };

    this.cartService.removeItem(newItem);
    
  }

  checkedChange(){
    this.cartItem.checked = !this.cartItem.checked;
  }


}
