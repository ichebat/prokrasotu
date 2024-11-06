import {
  Component,
  NgZone,
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
import { OrderService } from '../../services/order.service';
import { ConfirmDialogDemoComponent } from '../../components/confirm-dialog-demo/confirm-dialog-demo.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit, OnDestroy {
  owner = environment.owner;

  mainButtonTextValid = 'Оформить заказ в ' + this.owner.marketName;
  mainButtonTextProgress = 'Отправка...';
  mainButtonTextInvalid = 'Сначала добавьте товары в корзину';

  constructor(
    private location: Location,
    public cartService: CartService,
    public telegramService: TelegramService,
    private orderService: OrderService,
    private navigation: NavigationService,
    public dialog: MatDialog,
    private zone: NgZone,
    private router: Router,
  ) {
    this.goBack = this.goBack.bind(this);
    this.sendData = this.sendData.bind(this);

    // const sendDataToTelegram = () => {
    //   this.sendData();
    // };

    // effect(() => {

    //   if (this.cartService.$cart().totalCount > 0) {
    //     // this.telegramService.MainButton.show();
    //     this.telegramService.MainButton.enable();
    //     this.telegramService.MainButton.setText(this.mainButtonTextValid);
    //   } else {
    //     // this.telegramService.MainButton.hide();
    //     this.telegramService.MainButton.disable();
    //     this.telegramService.MainButton.setText(this.mainButtonTextInvalid);
    //   }

    //   this.telegramService.tg.onEvent('mainButtonClicked', sendDataToTelegram);
    //   return () => {
    //     this.telegramService.tg.offEvent(
    //       'mainButtonClicked',
    //       sendDataToTelegram,
    //     );
    //   };
    // });
  }

  changeAllItems(flag: boolean) {
    this.cartService.$cart().items.forEach((element, index) => {
      this.cartService.$cart().items[index].checked = flag;
    });
  }

  ngOnInit(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.show();
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
      this.telegramService.MainButton.show();
      this.telegramService.MainButton.enable();
      this.telegramService.MainButton.onClick(this.sendData);
      this.telegramService.MainButton.setText(this.mainButtonTextValid);
    }

    //this.telegramService.MainButton.show();
  }

  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      //this.telegramService.BackButton.hide();
      //this.telegramService.BackButton.offClick(this.goBack);

      this.telegramService.MainButton.hide();
      this.telegramService.MainButton.offClick(this.sendData);
    }
  }

  goBack() {
    if (
      this.telegramService.IsTelegramWebAppOpened &&
      !this.navigation.isHistoryAvailable
    ) {
      console.log('Закрываем Tg');
      this.telegramService.tg.close();
    }

    this.navigation.back();
  }

  sendData() {
    if (this.cartService.$cart().totalCount > 0) {
      this.orderService.updateId(''); // Обновляет сигналы на заказе

      // this.orderService.setOrderSignal({
      //   id: 0,
      //   items: this.cartService.$cart().items.filter(p=>p.checked),
      //   totalAmount: this.orderService.calculateTotalAmount(this.cartService.$cart().items.filter(p=>p.checked)),
      //   totalCount: this.orderService.calculateTotalCount(this.cartService.$cart().items.filter(p=>p.checked)),
      //   clientName: "",
      //   clientTgName: this.telegramService.UserName,
      //   clientPhone: "",
      //   clientAddress: "",
      //   delivery: {id: 0, name: "", description: "", amount: 0, freeAmount: 0},
      //   orderDate: new Date(),
      //   isAccepted:false,
      //   acceptDate: new Date(),
      //   isCompleted: false,
      //   completeDate: new Date(),
      //   isDeclined: false,
      //   declineDate: new Date(),
      //   declineReason: "",
      //   isCorrected: false,
      //   correctionDate: new Date(),
      //   correctionReason:"",
      //   description:"",
      // });
      this.router.navigate(['/order/']);
      //this.telegramService.MainButton.setText('Отправляем заказ в ProKrasotu');

      // this.telegramService.sendToGoogleAppsScript({"newOrder":this.product}).subscribe(response => {
      //   console.log("SUCCESS");
      //   this.telegramService.MainButton.setText('Ваш заказ отправлен в ProKrasotu');
      // });
    } else {
      this.telegramService.MainButton.setText(this.mainButtonTextInvalid);
      this.telegramService.MainButton.disable();
      setTimeout(() => {
        this.telegramService.MainButton.setText(this.mainButtonTextValid);
        this.telegramService.MainButton.enable();
        return;
      }, 5000);
      return;
    }
  }
}
