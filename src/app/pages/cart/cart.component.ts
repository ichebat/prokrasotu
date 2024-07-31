import { Component, OnDestroy, OnInit, effect } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { TelegramService } from '../../services/telegram.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy{
  
  /**
   *
   */
  constructor(private location: Location,
    public cartService: CartService,
    private telegramService: TelegramService,) {

    
  }

  ngOnInit(): void {
    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе

    this.telegramService.MainButton.setText('Отправить заказ в PROКРАСОТУ');
    this.telegramService.MainButton.show();
  }

  ngOnDestroy(): void {    
    this.telegramService.BackButton.hide();
    this.telegramService.BackButton.offClick(this.goBack);
  }

  goBack() {
    this.location.back();
  }

  sendData() {
    this.telegramService.MainButton.setText('Отправляем заказ в ProKrasotu');   
    
    // this.telegramService.sendToGoogleAppsScript({"newOrder":this.product}).subscribe(response => {
    //   console.log("SUCCESS");
    //   this.telegramService.MainButton.setText('Ваш заказ отправлен в ProKrasotu');
    // });
  }

}
