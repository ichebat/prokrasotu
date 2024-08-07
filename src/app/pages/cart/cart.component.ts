import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CartService } from '../../services/cart.service';
import { TelegramService } from '../../services/telegram.service';
import { Location } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit, OnDestroy {

  constructor(
    private location: Location,
    public cartService: CartService,
    private telegramService: TelegramService,
    private navigation: NavigationService,
    private router: Router,
  ) {
    this.goBack = this.goBack.bind(this);
    this.sendData = this.sendData.bind(this);

    const sendDataToTelegram = () => {
      this.sendData();
    };



    effect(() => {
      this.telegramService.tg.onEvent('mainButtonClicked', sendDataToTelegram);
      return () => {
        this.telegramService.tg.offEvent(
          'mainButtonClicked',
          sendDataToTelegram,
        );
      };
    });

    effect(() => {
      if (this.cartService.$cart().totalCount > 0) {
        this.telegramService.MainButton.show();
      } else this.telegramService.MainButton.hide();
    });
  }

  changeAllItems(flag: boolean) {
    
    this.cartService.$cart().items.forEach((element, index) => {
      this.cartService.$cart().items[index].checked = flag;
    });
    
  }
  

  ngOnInit(): void {
    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе

    this.telegramService.MainButton.setText('Оформить заказ в PROКРАСОТУ');
    //this.telegramService.MainButton.show();
  }

  ngOnDestroy(): void {
    this.telegramService.BackButton.hide();
    this.telegramService.BackButton.offClick(this.goBack);
    this.telegramService.MainButton.hide();
  }

  goBack() {
    //this.location.back();
    this.navigation.back();
  }

  sendData() {
    this.router.navigate(['/order/']);
    //this.telegramService.MainButton.setText('Отправляем заказ в ProKrasotu');

    // this.telegramService.sendToGoogleAppsScript({"newOrder":this.product}).subscribe(response => {
    //   console.log("SUCCESS");
    //   this.telegramService.MainButton.setText('Ваш заказ отправлен в ProKrasotu');
    // });
  }
}
