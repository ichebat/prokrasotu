import { Component, Input, OnDestroy, OnInit, effect } from '@angular/core';
import { CartService, IShoppingCart } from '../../services/cart.service';
import { TelegramService } from '../../services/telegram.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-cart-item',
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss'
})
export class CartItemComponent implements OnInit, OnDestroy {

  @Input() cart!: IShoppingCart;

  constructor(private location: Location,
    private cartService: CartService,
    private telegramService: TelegramService,) {

    this.goBack = this.goBack.bind(this);

    this.sendData = this.sendData.bind(this);

    const sendDataToTelegram = () => {      
      this.sendData();
    }
  
    effect(()=>{
      this.telegramService.tg.onEvent('mainButtonClicked', sendDataToTelegram);
      return () =>{
        this.telegramService.tg.offEvent('mainButtonClicked', sendDataToTelegram);
      }
    });

    
  }

  goBack() {
    this.location.back();
  }

  ngOnInit(): void {
    this.telegramService.MainButton.setText('Отправить заказ в PROКРАСОТУ');
    // this.telegramService.MainButton.show();
    // this.telegramService.MainButton.disable();
    this.telegramService.MainButton.show();
    // let f = () => this.sendData;
    // this.telegramService.MainButton.onClick(f);

    

    //this.telegramService.MainButton.onClick(this.sendData);
    
  }

  ngOnDestroy(): void {
    this.telegramService.MainButton.hide();
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

    this.telegramService.MainButton.setText('Отправляем заказ в ProKrasotu');
    //this.telegramService.MainButton.disable();
    
    this.telegramService.sendToGoogleAppsScript({"newOrder":this.cart}).subscribe(response => {
      console.log("SUCCESS");
      this.telegramService.MainButton.setText('Ваш заказ отправлен в ProKrasotu');
      //this.telegramService.MainButton.enable();
      // setTimeout(() => {
      //   this.telegramService.tg.close();
      // }, 5000);
    });

    
    
  }


}
