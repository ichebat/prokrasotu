import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Signal,
  ViewChild,
  booleanAttribute,
  effect,
  NgZone,
} from '@angular/core';
import { IOrder, OrderService } from '../../services/order.service';
import { TelegramService } from '../../services/telegram.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialogDemoComponent,
  DialogData,
} from '../confirm-dialog-demo/confirm-dialog-demo.component';
import { CartService, ICartItem } from '../../services/cart.service';

import { NavigationService } from '../../services/navigation.service';
import { Subscription, distinctUntilChanged, filter, takeUntil } from 'rxjs';
import { ProductSearchComponent } from '../product-search/product-search.component';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { DeliveryService, IDelivery } from '../../services/delivery.service';
import { AgreementComponent } from '../../pages/company/privacy/agreement/agreement.component';
import { PrivacyComponent } from '../../pages/company/privacy/privacy.component';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrl: './order-item.component.scss',
})
export class OrderItemComponent implements OnInit, OnDestroy {
  @Input() order!: IOrder; //заказ по которому строится контрол
  @Input() action: string = ''; //действие по которому строится контрол (accept, cancel, complete)

  form: FormGroup = new FormGroup({}); //реактивная форма

  owner = environment.owner;

  private subscr_form: Subscription = Subscription.EMPTY;

  dataSource: MatTableDataSource<ICartItem>; //dataSource для mat-table на форме

  displayedColumns: string[] = ['imageUrl', 'description', 'ActionBar']; //список колонок для отображения

  totalAmountOrder; //общая стоимость заказа с учетом доставки
  isUserAgreePersonalData: boolean = false; //для галочки с ПД
  isOrderItemsChanged: boolean = false; //менялся ли состав заказа
  isDeliveryChanged: boolean = false; //менялась ли доставка

  isMainButtonHidden = true; //иногда, когда открывается диалог, необходимо скрыть MainButton телеграма, чтобы он не закрывал экран, а после диалога вернуть как было
  MainButtonText = ''; //в зависимости от того какой режим разные надписи на главной кнопке телеграма

  //здесь храним видимость и доступность к редактированию контролов реактивной формы
  FormControlsFlags: any = [
    { controlName: 'delivery', visible: true, enabled: true },
    { controlName: 'clientAddress', visible: true, enabled: true },
    { controlName: 'clientName', visible: true, enabled: true },
    { controlName: 'clientTgName', visible: true, enabled: true },
    { controlName: 'clientTgChatId', visible: true, enabled: true },
    { controlName: 'clientPhone', visible: true, enabled: true },
    { controlName: 'correctionReason', visible: true, enabled: true },
    { controlName: 'cancellationReason', visible: true, enabled: true },
    { controlName: 'description', visible: true, enabled: true },
    { controlName: 'isAgeePersonalData', visible: true, enabled: true },

    { controlName: 'button_items_add', visible: true, enabled: true },
    { controlName: 'button_items_remove', visible: true, enabled: true },
    { controlName: 'button_items_replace', visible: true, enabled: true },
    { controlName: 'button_submit', visible: true, enabled: true },
    { controlName: 'button_close', visible: true, enabled: true },
    { controlName: 'button_accept', visible: true, enabled: true },
    { controlName: 'button_complete', visible: true, enabled: true },
    { controlName: 'button_cancel', visible: true, enabled: true },
  ];

  //когда нажимаем отправку кнопки становятся неактивными
  disableButton: boolean = false; //отключает кнопки на время отправки данных

  mainButtonTextValid = 'Отправить в ' + this.owner.marketName;
  mainButtonTextProgress = 'Отправка...';
  mainButtonTextInvalid = 'Некорректно заполнены поля';

  ClientAddressOptionsJSON; //для работы с dadata

  constructor(
    public orderService: OrderService,
    public deliveryService: DeliveryService,
    public cartService: CartService,
    public telegramService: TelegramService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private navigation: NavigationService,
    private fb: FormBuilder,
    private zone: NgZone,
  ) {
    //console.log("constructor order item");
    //биндим функции, чтобы от них потом корректно отписаться
    this.goBack = this.goBack.bind(this); //функция по кнопке "назад" телеграм
    this.sendData = this.sendData.bind(this); //функция для главной MainButton кнопки телеграм
    this.acceptOrder = this.acceptOrder.bind(this); //функция для главной MainButton кнопки телеграм
    this.cancelOrder = this.cancelOrder.bind(this); //функция для главной MainButton кнопки телеграм
    this.completeOrder = this.completeOrder.bind(this); //функция для главной MainButton кнопки телеграм
    this.closeForm = this.closeForm.bind(this); //функция для главной MainButton кнопки телеграм

    //ниже привязка действия к MainButton телеграм
    //если существующий заказ просматривает не админ, то его можно только отменить
    // const sendDataToTelegram = () => {
    //   if (
    //     this.getVisible('button_submit') &&
    //     this.getEnabled('button_submit')
    //   ) {
    //     this.sendData();
    //   } else if (
    //     this.getVisible('button_accept') &&
    //     this.getEnabled('button_accept')
    //   ) {
    //     this.acceptOrder();
    //   } else if (
    //     this.getVisible('button_cancel') &&
    //     this.getEnabled('button_cancel')
    //   ) {
    //     this.cancelOrder();
    //   } else if (
    //     this.getVisible('button_complete') &&
    //     this.getEnabled('button_complete')
    //   ) {
    //     this.completeOrder();
    //   } else if (
    //     this.getVisible('button_close') &&
    //     this.getEnabled('button_close')
    //   ) {
    //     this.closeForm();
    //   }
    // };

    // //привязка идет эффектом
    // effect(() => {
    //   this.telegramService.tg.onEvent('mainButtonClicked', sendDataToTelegram);
    //   return () => {
    //     this.telegramService.tg.offEvent(
    //       'mainButtonClicked',
    //       sendDataToTelegram,
    //     );
    //   };
    // });

    this.totalAmountOrder = 0; //тут считается общая сумма товаров в заказе + доставка

    this.dataSource = new MatTableDataSource([] as ICartItem[]); //для отображения таблицы с товарами

    //строим реактивную форму с валидацией
    this.form = fb.group({
      id: [this.order?.id, []],
      items: [this.order?.items, []],
      delivery: [
        this.order?.delivery!,
        [Validators.required, this.deliveryValidator],
      ],
      totalAmount: [this.order?.totalAmount, []],
      totalCount: [this.order?.totalCount, []],
      clientName: [
        this.telegramService.FIO,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern('[A-Za-zА-ЯЁа-яё0-9-_ ]{2,50}'),
        ],
      ],
      clientTgName: [
        this.telegramService.UserName,
        [
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern('[A-Za-zА-ЯЁа-яё0-9-_ ]{2,50}'),
        ],
      ],
      clientTgChatId: [
        this.telegramService.Id,
        [
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern('[0-9]{2,50}'),
        ],
      ],
      clientPhone: [
        this.order?.clientPhone,
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          //Validators.pattern('\([7-9]{1}\d{2}\)\s\d{3}\-\d{2}\-\d{2}'),
        ],
      ],
      clientAddress: [this.order?.clientAddress, [Validators.maxLength(500)]],
      isAgeePersonalData: [
        this.isUserAgreePersonalData,
        [
          //Validators.requiredTrue,
        ],
      ],
      correctionReason: [
        this.order?.correctionReason,
        [Validators.maxLength(500)],
      ],

      cancellationReason: [
        this.order?.cancellationReason,
        [Validators.maxLength(500)],
      ],
      description: [this.order?.description, [Validators.maxLength(500)]],
    });
  }

  // валидатор выбранной доставки
  //необходимо, так как по умолчанию ставится пустая доставка с Id=0 а не null
  deliveryValidator(control: FormControl): { [s: string]: boolean } | null {
    if (control.value && (control.value as IDelivery).id <= 0) {
      return { delivery: true };
    }
    return null;
  }

  // валидатор адреса доставки
  clientAddressValidator(
    control: FormControl,
  ): { [s: string]: boolean } | null {
    if (
      control.value &&
      control.value === '' &&
      this.order.delivery.isAddressRequired
    ) {
      return { clientAddress: true };
    }
    return null;
  }

  //после конструктора необходимо заполнить форму начальными значениями
  setInitialValue() {
    this.form.controls['id'].setValue(this.order?.id);
    this.form.controls['items'].setValue(this.order?.items);
    this.form.controls['delivery'].setValue(this.order?.delivery), //{value: this.order?.delivery, disabled: (this.order?.isAccepted || this.order?.isCompleted || this.order?.isCancelled)});
      this.form.controls['totalAmount'].setValue(this.order?.totalAmount);
    this.form.controls['totalCount'].setValue(this.order?.totalCount);
    this.form.controls['clientName'].setValue(this.order?.clientName);
    this.form.controls['clientTgName'].setValue(this.order?.clientTgName);
    this.form.controls['clientTgChatId'].setValue(this.order?.clientTgChatId);
    this.form.controls['clientPhone'].setValue(this.order?.clientPhone);
    this.form.controls['clientAddress'].setValue(this.order?.clientAddress);
    this.form.controls['correctionReason'].setValue(
      this.order?.correctionReason,
    );
    this.form.controls['cancellationReason'].setValue(
      this.order?.cancellationReason,
    );
    this.form.controls['description'].setValue(this.order?.description);

    //console.log(this.order);

    //обновляем источник данных для таблицы
    this.dataSource = new MatTableDataSource(this.order.items);

    this.totalAmountOrder =
      this.order.totalAmount +
      (this.order.delivery.freeAmount <= this.order.totalAmount
        ? 0
        : this.order.delivery.amount);

    //выставляем флаги отображения контролов
    this.FormControlsFlags.forEach((item) => {
      //1. ******************************************* */
      //если создается новый заказ не через телеграм бота (через сайт)
      if (!this.telegramService.IsTelegramWebAppOpened && this.order?.id == 0) {
        //отображение следующих контролов будет изменено
        if (
          item.controlName == 'clientTgName' ||
          item.controlName == 'clientTgChatId' ||
          item.controlName == 'correctionReason' ||
          item.controlName == 'cancellationReason' ||
          item.controlName == 'description' ||
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept' ||
          item.controlName == 'button_complete' ||
          item.controlName == 'button_cancel' ||
          item.controlName == 'button_close'
        ) {
          item.visible = false;
        }

        //возможность редактирования следующих контролов будет изменена
        if (
          item.controlName == 'clientTgName' ||
          item.controlName == 'clientTgChatId' ||
          item.controlName == 'correctionReason' ||
          item.controlName == 'cancellationReason' ||
          item.controlName == 'description' ||
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept' ||
          item.controlName == 'button_complete' ||
          item.controlName == 'button_cancel' ||
          item.controlName == 'button_close'
        ) {
          item.enabled = false;
        }
      }

      //2. ******************************************* */
      //если создается новый заказ ЧЕРЕЗ телеграм бота (НЕ через сайт)
      else if (
        this.telegramService.IsTelegramWebAppOpened &&
        this.order?.id == 0
      ) {
        //отображение следующих контролов будет изменено
        if (
          item.controlName == 'correctionReason' ||
          item.controlName == 'cancellationReason' ||
          item.controlName == 'description' ||
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept' ||
          item.controlName == 'button_complete' ||
          item.controlName == 'button_cancel' ||
          item.controlName == 'button_close'
        ) {
          item.visible = false;
        }
        if (item.controlName == 'clientTgName') {
          item.visible = true && this.telegramService.isAdmin;
        }
        if (item.controlName == 'clientTgChatId') {
          item.visible = true && this.telegramService.isAdmin;
        }

        //возможность редактирования следующих контролов будет изменена
        if (
          item.controlName == 'correctionReason' ||
          item.controlName == 'cancellationReason' ||
          item.controlName == 'description' ||
          item.controlName == 'clientTgName' ||
          item.controlName == 'clientTgChatId' ||
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept' ||
          item.controlName == 'button_complete' ||
          item.controlName == 'button_cancel' ||
          item.controlName == 'button_close'
        ) {
          item.enabled = false;
        }
      }

      //3. ******************************************* */
      //если заказ редактируется ЧЕРЕЗ телеграм бота (НЕ через сайт)
      else if (
        (this.telegramService.IsTelegramWebAppOpened ||
          this.telegramService.isAdmin) &&
        this.order?.id > 0
      ) {
        if (item.controlName == 'clientName') {
          item.visible =
            true && this.order?.clientName && this.telegramService.isAdmin;
        }
        if (item.controlName == 'clientPhone') {
          item.visible =
            true && this.order?.clientPhone && this.telegramService.isAdmin;
        }
        if (item.controlName == 'delivery') {
          item.visible =
            true && this.order?.delivery && this.telegramService.isAdmin;
        }
        if (item.controlName == 'clientAddress') {
          item.visible =
            true &&
            this.order?.delivery.isAddressRequired &&
            this.telegramService.isAdmin;
        }
        if (item.controlName == 'clientTgName') {
          item.visible =
            true && this.order?.clientTgName && this.telegramService.isAdmin;
        }
        if (item.controlName == 'clientTgChatId') {
          item.visible =
            true && this.order?.clientTgChatId && this.telegramService.isAdmin;
        }
        if (item.controlName == 'cancellationReason') {
          item.visible =
            true &&
            (this.order?.cancellationReason ||
              this.telegramService.isAdmin ||
              this.action == 'cancel');
        }
        if (item.controlName == 'correctionReason') {
          item.visible =
            true &&
            (this.order?.correctionReason || this.telegramService.isAdmin);
        }
        if (item.controlName == 'description') {
          item.visible =
            true && (this.order?.description || this.telegramService.isAdmin);
        }
        if (item.controlName == 'isAgeePersonalData') {
          item.visible = false;
        }
        if (
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept'
        ) {
          item.visible =
            true &&
            this.telegramService.isAdmin &&
            !this.order?.isAccepted &&
            !this.order?.isCancelled &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_complete') {
          item.visible =
            true &&
            this.telegramService.isAdmin &&
            this.order?.isAccepted &&
            !this.order?.isCancelled &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_cancel') {
          item.visible =
            true && !this.order?.isCancelled && !this.order?.isCompleted;
        }
        if (item.controlName == 'button_submit') {
          item.visible =
            true &&
            this.telegramService.isAdmin &&
            !this.order?.isCancelled &&
            !this.order?.isCompleted;
        }
        // if (item.controlName == 'button_close') {
        //   item.visible =
        //     true &&
        //     (//!this.telegramService.isAdmin ||
        //       this.order?.isCancelled ||
        //       this.order?.isCompleted);
        //
        // }

        //возможность редактирования следующих контролов будет изменена
        if (
          item.controlName == 'clientTgName' ||
          item.controlName == 'clientTgChatId' ||
          item.controlName == 'clientName' ||
          item.controlName == 'clientPhone' ||
          item.controlName == 'isAgeePersonalData'
        ) {
          item.enabled = false;
        }
        if (item.controlName == 'delivery') {
          item.enabled =
            true && this.telegramService.isAdmin && this.action == 'edit';
        }
        if (item.controlName == 'clientAddress') {
          item.enabled =
            true && this.telegramService.isAdmin && this.action == 'edit';
        }
        if (item.controlName == 'correctionReason') {
          item.enabled =
            true && this.telegramService.isAdmin && this.action == 'edit';
        }
        if (item.controlName == 'cancellationReason') {
          item.enabled = true && this.action == 'cancel';
        }
        if (item.controlName == 'description') {
          item.enabled =
            true && this.telegramService.isAdmin && this.action == 'edit';
        }
        if (
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace'
        ) {
          item.enabled =
            true &&
            this.telegramService.isAdmin &&
            !this.order?.isAccepted &&
            !this.order?.isCancelled &&
            !this.order?.isCompleted &&
            this.action == 'edit';
        }
        if (item.controlName == 'button_accept') {
          item.enabled =
            true &&
            this.telegramService.isAdmin &&
            !this.order?.isAccepted &&
            !this.order?.isCancelled &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_complete') {
          item.enabled =
            true &&
            this.telegramService.isAdmin &&
            this.order?.isAccepted &&
            !this.order?.isCancelled &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_cancel') {
          item.enabled =
            true && !this.order?.isCancelled && !this.order?.isCompleted;
        }
        if (item.controlName == 'button_submit') {
          item.enabled =
            true &&
            this.telegramService.isAdmin &&
            !this.order?.isAccepted &&
            !this.order?.isCancelled &&
            !this.order?.isCompleted;
        }
        // if (item.controlName == 'button_close') {
        //   item.enabled =
        //     true &&
        //     (//!this.telegramService.isAdmin ||
        //       this.order?.isCancelled ||
        //       this.order?.isCompleted);
        //
        // }
      }

      //4. ******************************************* */
      //если заказ редактируется не через телеграм бота (через сайт)
      else if (
        !this.telegramService.IsTelegramWebAppOpened &&
        this.order?.id > 0
      ) {
        //такое запрещено, все скрываем и не редактируем
        item.visible = false;
        item.enabled = false;
      }
      //КОНЕЦ. ******************************************* */

      //выключаем контролы
      if (!item.controlName.toString().startsWith('button_')) {
        if (!item.enabled) this.form.controls[item.controlName].disable();
      }
    });

    //по выходу может оказаться несколько активных кнопок
    //если запрос осуществлялся с action то отключаем лишние
    //должна остаться только одна кнопка с visible и enabled true из пяти
    //вся эта логика работает только на редактирование существующего заказа, при создании - нет
    if (this.order?.id > 0) {
      if (this.action == 'view' || this.action == '') {
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_submit',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_submit',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_accept',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_accept',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_cancel',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_cancel',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_complete',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_complete',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_close',
        )!.enabled = true;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_close',
        )!.visible = true;
      }

      if (this.action == 'edit') {
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_accept',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_accept',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_cancel',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_cancel',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_complete',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_complete',
        )!.visible = false;
        //если редактировать нельзя
        if (
          !this.FormControlsFlags.find((p) => p.controlName == 'button_submit')!
            .visible
        ) {
          if (!this.order.isAccepted)
            this.MainButtonText =
              'Вы не можете изменить данный заказ, так как он находится в обработке у продавца';
          if (this.order.isAccepted)
            this.MainButtonText =
              'Вы не можете изменить данный заказ, так как он уже подтвержден продавцом';
          if (this.order.isCompleted)
            this.MainButtonText =
              'Вы не можете изменить данный заказ, так как он уже завершен';
          if (this.order.isCancelled)
            this.MainButtonText =
              'Вы не можете изменить данный заказ, так как он отменен';
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.enabled = true;
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.visible = true;
        } else {
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.enabled = false;
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.visible = false;
        }
      }

      if (this.action == 'accept') {
        //console.log("accept | "+this.FormControlsFlags.find(p=>p.controlName == 'button_accept')!.visible)
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_submit',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_submit',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_cancel',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_cancel',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_complete',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_complete',
        )!.visible = false;
        //если подтвердить нельзя
        if (
          !this.FormControlsFlags.find((p) => p.controlName == 'button_accept')!
            .visible
        ) {
          if (!this.telegramService.isAdmin)
            this.MainButtonText = 'Вы не можете подтвердить заказ';
          if (this.order.isAccepted)
            this.MainButtonText =
              'Вы не можете подтвердить данный заказ, так как он уже подтвержден продавцом';
          if (this.order.isCompleted)
            this.MainButtonText =
              'Вы не можете подтвердить данный заказ, так как он уже завершен';
          if (this.order.isCancelled)
            this.MainButtonText =
              'Вы не можете подтвердить данный заказ, так как он уже отменен';
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.enabled = true;
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.visible = true;
        } else {
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.enabled = false;
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.visible = false;
        }
      }

      if (this.action == 'cancel') {
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_submit',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_submit',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_accept',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_accept',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_complete',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_complete',
        )!.visible = false;
        //если подтвердить нельзя
        if (
          !this.FormControlsFlags.find((p) => p.controlName == 'button_cancel')!
            .visible
        ) {
          if (this.order.isCompleted)
            this.MainButtonText =
              'Вы не можете отменить данный заказ, так как он уже завершен';
          if (this.order.isCancelled)
            this.MainButtonText =
              'Вы не можете отменить данный заказ, так как он уже отменен';
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.enabled = true;
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.visible = true;
        } else {
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.enabled = false;
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.visible = false;
        }
      }

      if (this.action == 'complete') {
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_submit',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_submit',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_accept',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_accept',
        )!.visible = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_cancel',
        )!.enabled = false;
        this.FormControlsFlags.find(
          (p) => p.controlName == 'button_cancel',
        )!.visible = false;
        //если подтвердить нельзя
        if (
          !this.FormControlsFlags.find(
            (p) => p.controlName == 'button_complete',
          )!.visible
        ) {
          if (!this.order.isAccepted)
            this.MainButtonText =
              'Вы не можете завершить данный заказ, так как он находится в обработке у продавца';
          if (this.order.isCompleted)
            this.MainButtonText =
              'Вы не можете завершить данный заказ, так как он уже завершен';
          if (this.order.isCancelled)
            this.MainButtonText =
              'Вы не можете завершить данный заказ, так как он уже отменен';
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.enabled = true;
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.visible = true;
        } else {
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.enabled = false;
          this.FormControlsFlags.find(
            (p) => p.controlName == 'button_close',
          )!.visible = false;
        }
      }
    }
  }

  //функция вывода флага видимости
  getVisible(itemName: string) {
    let result = true;
    const item = this.FormControlsFlags.find(
      (p) =>
        p.controlName.toString().toLowerCase() ==
        itemName.toString().toLowerCase(),
    );
    if (item) result = item.visible;
    return result;
  }

  //функция вывода флага доступности редактирования
  getEnabled(itemName: string) {
    let result = true;
    const item = this.FormControlsFlags.find(
      (p) =>
        p.controlName.toString().toLowerCase() ==
        itemName.toString().toLowerCase(),
    );
    if (item) result = item.enabled;
    return result;
  }

  ngOnInit(): void {
    this.setInitialValue();

    // //подписываемся на изменения формы, для скрытия/отображения MainButton
    // this.subscr_form = this.form.statusChanges
    //   .pipe(distinctUntilChanged())
    //   .subscribe(() => {
    //     console.log(this.form.status);
    //     this.isFormValid();
    //   });
    // this.form.updateValueAndValidity(); //обновляем статус формы

    if (this.telegramService.IsTelegramWebAppOpened) {
      //this.telegramService.BackButton.show();
      //this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
      this.telegramService.MainButton.show();
      this.telegramService.MainButton.enable();
      //this.telegramService.MainButton.onClick(this.sendData);
      if (
        this.getVisible('button_submit') &&
        this.getEnabled('button_submit')
      ) {
        this.telegramService.MainButton.onClick(this.sendData);
      } else if (
        this.getVisible('button_accept') &&
        this.getEnabled('button_accept')
      ) {
        this.telegramService.MainButton.onClick(this.acceptOrder);
      } else if (
        this.getVisible('button_cancel') &&
        this.getEnabled('button_cancel')
      ) {
        this.telegramService.MainButton.onClick(this.cancelOrder);
      } else if (
        this.getVisible('button_complete') &&
        this.getEnabled('button_complete')
      ) {
        this.telegramService.MainButton.onClick(this.completeOrder);
      } else if (
        this.getVisible('button_close') &&
        this.getEnabled('button_close')
      ) {
        this.telegramService.MainButton.onClick(this.closeForm);
      }

      this.telegramService.MainButton.setText(this.mainButtonTextValid);
    }

    this.onHandleUpdate();
  }

  //отвязываем кнопки
  ngOnDestroy(): void {
    this.subscr_form.unsubscribe();
    if (this.telegramService.IsTelegramWebAppOpened) {
      //this.telegramService.BackButton.hide();
      //this.telegramService.BackButton.offClick(this.goBack);

      this.telegramService.MainButton.hide();
      //this.telegramService.MainButton.offClick(this.mainButtonClick);
      if (
        this.getVisible('button_submit') &&
        this.getEnabled('button_submit')
      ) {
        this.telegramService.MainButton.offClick(this.sendData);
      } else if (
        this.getVisible('button_accept') &&
        this.getEnabled('button_accept')
      ) {
        this.telegramService.MainButton.offClick(this.acceptOrder);
      } else if (
        this.getVisible('button_cancel') &&
        this.getEnabled('button_cancel')
      ) {
        this.telegramService.MainButton.offClick(this.cancelOrder);
      } else if (
        this.getVisible('button_complete') &&
        this.getEnabled('button_complete')
      ) {
        this.telegramService.MainButton.offClick(this.completeOrder);
      } else if (
        this.getVisible('button_close') &&
        this.getEnabled('button_close')
      ) {
        this.telegramService.MainButton.offClick(this.closeForm);
      }
      this.isMainButtonHidden = true;
    }
  }

  // //проверка валидности и скрытие/отображение главной кнопки
  // private isFormValid() {
  //   if (this.form.valid) {
  //     this.telegramService.MainButton.show();
  //     this.isMainButtonHidden = false;
  //     // this.telegramService.MainButton.enable();
  //     this.telegramService.MainButton.setText(this.mainButtonTextValid);
  //   } else {
  //     this.telegramService.MainButton.hide();
  //     this.isMainButtonHidden = true;
  //     // this.telegramService.MainButton.disable();
  //     this.telegramService.MainButton.setText(this.mainButtonTextInvalid);
  //   }
  // }

  //кнопка назад в WebApp telegram
  goBack() {
    //закрываем tg если редактировали заказ
    //или если мы открыли страницу с кнопкой закрыть и истории ранее нету, то закрывает телеграм
    if (
      this.telegramService.IsTelegramWebAppOpened &&
      (this.action == 'edit' ||
        this.action == 'complete' ||
        this.action == 'cancel' ||
        this.action == 'accept') &&
      !this.navigation.isHistoryAvailable
    ) {
      console.log('Закрываем Tg');
      this.telegramService.tg.close();
    }

    this.navigation.back();
  }

  //функция подтверждение заказа в магазине
  acceptOrder() {
    //принятым считается заказ который не был принят ранее и не отменен
    if (!this.getVisible('button_accept') || !this.getEnabled('button_accept'))
      return;

    //редактирование существующего заказа может делать только админ
    if (
      this.telegramService.Id &&
      this.form.valid &&
      this.order.id > 0 &&
      this.telegramService.isAdmin
    ) {
      //если заказ переводится в "Готов к оплате", но была коррекция необходимо подтверждение
      if (this.isOrderItemsChanged || this.isDeliveryChanged) {
        //if (!this.telegramService.IsTelegramWebAppOpened)
        this.zone.run(() => {
          const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
            ConfirmDialogDemoComponent,
            {
              data: {
                message: 'Заказ был изменен',
                description:
                  'Клиент получит сообщение о причине изменений: [' +
                  this.order.correctionReason +
                  '].\nМожно изменить сообщение перед отправкой. Если все устраивает - подтвердите действие.',
              },
            },
          );
          dialogRef.afterClosed().subscribe((result) => {
            if (result == true) {
              this.order.isAccepted = true;
              this.order.acceptDate = new Date();
              this.sendData();
            } else return;
          });
        });
      } else {
        this.order.isAccepted = true;
        this.order.acceptDate = new Date();
        this.sendData();
      }
    }
  }

  //функция отмены заказа
  cancelOrder() {
    //отменить можно если не отменяли ранее
    if (!this.getVisible('button_cancel') || !this.getEnabled('button_cancel'))
      return;

    //if (!this.telegramService.IsTelegramWebAppOpened)
    this.zone.run(() => {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: 'Заказ отменяется',
            description:
              'Причина отмены заказа: [' +
              (this.form.controls['cancellationReason'].value
                ? this.form.controls['cancellationReason'].value.toString()
                : 'Не указана') +
              ']. Можно изменить причину перед отправкой. Если все устраивает - подтвердите действие.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
          this.order.isCancelled = true;
          this.order.cancellationDate = new Date();
          this.order.cancellationReason =
            this.form.controls['cancellationReason'].value;
          this.sendData();
        } else return;
      });
    });
  }

  //функция завершения заказа
  completeOrder() {
    //завершить можно если заказ был принят и не отменялся позднее
    if (
      !this.getVisible('button_complete') ||
      !this.getEnabled('button_complete')
    )
      return;
    //if (!this.telegramService.IsTelegramWebAppOpened)
    this.zone.run(() => {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: 'Заказ завершается',
            description:
              'Заказ считается выполненным и будет завершен. После этого он будет помещен в архив. Если все устраивает - подтвердите действие.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
          this.order.isCompleted = true;
          this.order.completeDate = new Date();
          this.sendData();
        } else return;
      });
    });
  }

  //функция закрытия окна
  closeForm() {
    if (!this.getVisible('button_close') || !this.getEnabled('button_close'))
      return;

    this.goBack();
  }

  //функция отправки данных (id ==0 для нового заказа, id>0 для редактирования)
  sendData() {
    if (!this.form.valid) {
      this.telegramService.MainButton.setText(this.mainButtonTextInvalid);
      this.telegramService.MainButton.disable();
      setTimeout(() => {
        this.telegramService.MainButton.setText(this.mainButtonTextValid);
        this.telegramService.MainButton.enable();
        return;
      }, 5000);
      return;
    }

    //добавление нового заказа делается кнопкой submit
    if (
      this.order.id == 0 &&
      this.getVisible('button_submit') &&
      this.getEnabled('button_submit') &&
      this.form.valid
    ) {
      //проверка не более maxOrders заказов в работе на аккаунт tg

      this.disableButton = true;
      this.telegramService.MainButton.setText(this.mainButtonTextProgress);
      this.telegramService.MainButton.disable();

      this.orderService
        .sendOrderToGoogleAppsScript(
          this.telegramService.Id,
          this.telegramService.UserName,
          'addOrder',
          {
            id: 0,
            items: this.order?.items,
            totalAmount: this.orderService.calculateTotalAmount(
              this.order?.items,
            ),
            totalCount: this.orderService.calculateTotalCount(
              this.order?.items,
            ),
            clientName: this.form.controls['clientName'].value,
            clientTgName: this.form.controls['clientTgName'].value,
            clientTgChatId: this.form.controls['clientTgChatId'].value,
            clientPhone: this.form.controls['clientPhone'].value,
            clientAddress: this.order.delivery.isAddressRequired
              ? this.form.controls['clientAddress'].value
              : '',
            delivery: this.form.controls['delivery'].value as IDelivery,
            orderDate: new Date(),
            isAccepted: false,
            acceptDate: new Date(),
            isCompleted: false,
            completeDate: new Date(),
            isCancelled: false,
            cancellationDate: new Date(),
            cancellationReason: '',
            isCorrected: false,
            correctionDate: new Date(),
            correctionReason: '',
            description: this.form.controls['description'].value,
            isClientPay: false,
            clientPayDate: new Date(),
            clientPayInfo: '',
          },
        )
        .subscribe({
          next: (data) => {
            const addOrder_response = data;
            console.log('addOrder data', data);
            //если заказ оформлялся не через телеграм то выводим данные в окне
            if (
              !this.telegramService.IsTelegramWebAppOpened &&
              addOrder_response?.status == 'success' &&
              addOrder_response?.data?.action.toString().toLowerCase() ==
                'addorder'
            )
              this.zone.run(() => {
                const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
                  ConfirmDialogDemoComponent,
                  {
                    data: {
                      message: addOrder_response.message,
                      description:
                        'Номер вашего заказа: [' +
                        addOrder_response.data.id +
                        ']. Пожалуйста, запомните его. Для продолжения нажмите кнопку.',
                      showCancelButton: false,
                    },
                  },
                );
                dialogRef.afterClosed().subscribe((result) => {
                  return;
                });
              });
          },
          error: (err) => {
            this.onHandleUpdate();
            console.log('addOrder error', err);
          },
          complete: () => {
            //обновляем корзину
            let flagCart = false;
            this.order?.items.forEach((item) => {
              this.cartService.$cart.update((currentCart) => {
                const existingItem = currentCart.items.find(
                  (i) => i.product.id === item.product.id,
                );
                if (!existingItem) {
                  return currentCart;
                } else {
                  if (existingItem.quantity - item.quantity <= 0) {
                    item.quantity = existingItem.quantity;
                  }
                  existingItem.quantity -= item.quantity;
                  flagCart = true;
                }

                currentCart.items = currentCart.items.filter(
                  (p) => p.quantity > 0,
                );

                currentCart.totalCount = this.cartService.calculateTotalCount(
                  currentCart.items,
                );
                currentCart.totalAmount = this.cartService.calculateTotalAmount(
                  currentCart.items,
                );

                return currentCart;
              });
            });

            //обновляем корзину в таблице
            if (flagCart && this.telegramService.Id) {
              this.cartService
                .sendCartToGoogleAppsScript(
                  this.telegramService.Id,
                  this.telegramService.UserName,
                  'removeCart',
                  this.cartService.$cart(),
                )
                .subscribe({
                  next: (data) => {
                    console.log('removeCart data', data);
                  },
                  error: (err) => {
                    this.onHandleUpdate();
                    console.log('removeCart error', err);
                  },
                  complete: () => {
                    console.log('removeCart complete');
                    //console.log(this.cartService.$cart());
                  },
                });
            }

            this.onHandleUpdate();
            console.log('addOrder complete');
            this.router.navigate(['/']);
            if (this.telegramService.IsTelegramWebAppOpened)
              this.telegramService.tg.close();
          },
        });
    }

    if (
      ((this.getVisible('button_submit') && this.getEnabled('button_submit')) ||
        (this.getVisible('button_accept') &&
          this.getEnabled('button_accept')) ||
        (this.getVisible('button_cancel') &&
          this.getEnabled('button_cancel')) ||
        (this.getVisible('button_complete') &&
          this.getEnabled('button_complete'))) &&
      this.form.valid &&
      this.order.id > 0
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText(this.mainButtonTextProgress);
      this.telegramService.MainButton.disable();

      //console.log(this.order);

      this.orderService
        .sendOrderToGoogleAppsScript(
          this.telegramService.Id,
          this.telegramService.UserName,
          'updateOrder',
          {
            id: this.order?.id,
            items: this.order?.items,
            totalAmount: this.orderService.calculateTotalAmount(
              this.order?.items,
            ),
            totalCount: this.orderService.calculateTotalCount(
              this.order?.items,
            ),
            clientName: this.form.controls['clientName'].value,
            clientTgName: this.order?.clientTgName,
            clientTgChatId: this.order?.clientTgChatId,
            clientPhone: this.form.controls['clientPhone'].value,
            clientAddress: this.order.delivery.isAddressRequired
              ? this.form.controls['clientAddress'].value
              : '',
            delivery: this.form.controls['delivery'].value as IDelivery,
            orderDate: this.order?.orderDate,
            isAccepted: this.order?.isAccepted,
            acceptDate: this.order?.acceptDate,
            isCompleted: this.order?.isCompleted,
            completeDate: this.order?.completeDate,
            isCancelled: this.order?.isCancelled,
            cancellationDate: this.order?.cancellationDate,
            cancellationReason: this.order?.cancellationReason,
            isCorrected:
              this.order?.isCorrected ||
              this.isDeliveryChanged ||
              this.isOrderItemsChanged,
            correctionDate:
              this.isDeliveryChanged || this.isOrderItemsChanged
                ? new Date()
                : this.order?.correctionDate,
            correctionReason: this.form.controls['correctionReason'].value,
            description: this.form.controls['description'].value,
            isClientPay: this.order?.isClientPay,
            clientPayDate: this.order?.clientPayDate,
            clientPayInfo: this.order?.clientPayInfo,
          },
        )
        .subscribe({
          next: (data) => {
            console.log('updateOrder data', data);
          },
          error: (err) => {
            this.onHandleUpdate();
            console.log('updateOrder error', err);
          },
          complete: () => {
            //обновляем корзину
            let flagCart = false;
            this.order?.items.forEach((item) => {
              this.cartService.$cart.update((currentCart) => {
                const existingItem = currentCart.items.find(
                  (i) => i.product.id === item.product.id,
                );
                if (!existingItem) {
                  return currentCart;
                } else {
                  if (existingItem.quantity - item.quantity < 0) {
                    item.quantity = existingItem.quantity;
                  }
                  existingItem.quantity -= item.quantity;
                  flagCart = true;
                }

                currentCart.items = currentCart.items.filter(
                  (p) => p.quantity > 0,
                );

                currentCart.totalCount = this.cartService.calculateTotalCount(
                  currentCart.items,
                );
                currentCart.totalAmount = this.cartService.calculateTotalAmount(
                  currentCart.items,
                );

                return currentCart;
              });
            });

            //обновляем корзину в таблице
            if (flagCart && this.telegramService.Id) {
              this.cartService
                .sendCartToGoogleAppsScript(
                  this.telegramService.Id,
                  this.telegramService.UserName,
                  'removeCart',
                  this.cartService.$cart(),
                )
                .subscribe({
                  next: (data) => {
                    console.log('removeCart data', data);
                  },
                  error: (err) => {
                    console.log('removeCart error', err);
                  },
                  complete: () => {
                    console.log('removeCart complete');
                    //console.log(this.cartService.$cart());
                  },
                });
            }

            this.onHandleUpdate();
            console.log('updateOrder complete');
            this.router.navigate(['/']);
            if (this.telegramService.IsTelegramWebAppOpened)
              this.telegramService.tg.close();
          },
        });
    }
  }

  //вызывается по окончании обновления
  onHandleUpdate() {
    this.disableButton = false;
    this.telegramService.MainButton.enable();
    if (this.getVisible('button_close') && this.getEnabled('button_close')) {
      this.telegramService.MainButton.setText('Закрыть');
    } else if (
      this.getVisible('button_submit') &&
      this.getEnabled('button_submit')
    ) {
      if (this.order.id > 0) {
        this.telegramService.MainButton.setText('Обновить данные');
      } else {
        this.telegramService.MainButton.setText(
          'Отправить в ' + this.owner.marketName,
        );
      }
    } else if (
      this.getVisible('button_accept') &&
      this.getEnabled('button_accept')
    ) {
      if (this.order.delivery.isAddressRequired)
        this.telegramService.MainButton.setText('Отправлен в доставку');
      else this.telegramService.MainButton.setText('Готов к выдаче');
    } else if (
      this.getVisible('button_cancel') &&
      this.getEnabled('button_cancel')
    ) {
      this.telegramService.MainButton.setText('Отменить заказ');
    } else if (
      this.getVisible('button_complete') &&
      this.getEnabled('button_complete')
    ) {
      this.telegramService.MainButton.setText('Завершить заказ');
    }
  }

  //при изменении доставки (доступно только для магазина) должна меняться причина
  deliveryChange(item: IDelivery) {
    this.isDeliveryChanged = true;
    this.order.correctionReason =
      'Заказ изменен в магазине: Изменена доставка в заказе';
    this.form.controls['correctionReason'].setValue(
      this.order.correctionReason,
    );

    this.order.delivery = item;
    if (this.order.delivery.isAddressRequired) {
      this.form.controls['clientAddress'].clearValidators();
      this.form.controls['clientAddress'].setValidators([
        Validators.required,
        Validators.maxLength(500),
      ]);
    } else {
      this.form.controls['clientAddress'].setValidators([
        Validators.maxLength(500),
      ]);
    }
    this.form.controls['clientAddress'].updateValueAndValidity();

    this.totalAmountOrder =
      this.order.totalAmount +
      (item.freeAmount <= this.order.totalAmount ? 0 : item.amount);
  }

  onClientNameClear() {
    if (!this.form.controls['clientName'].disabled) {
      this.order.clientName = '';
      this.form.controls['clientName'].setValue(this.order.clientName);
    }
  }
  onClientTgNameClear() {
    if (!this.form.controls['clientTgName'].disabled) {
      this.order.clientTgName = '';
      this.form.controls['clientTgName'].setValue(this.order.clientTgName);
    }
  }
  onClientTgChatIdClear() {
    if (!this.form.controls['clientTgChatId'].disabled) {
      this.order.clientTgChatId = '';
      this.form.controls['clientTgChatId'].setValue(this.order.clientTgChatId);
    }
  }
  onClientPhoneClear() {
    if (!this.form.controls['clientPhone'].disabled) {
      this.order.clientPhone = '';
      this.form.controls['clientPhone'].setValue(this.order.clientPhone);
    }
  }
  onClientAddressClear() {
    if (!this.form.controls['clientAddress'].disabled) {
      this.order.clientAddress = '';
      this.form.controls['clientAddress'].setValue(this.order.clientAddress);
    }
  }
  onCancellationReasonClear() {
    if (!this.form.controls['cancellationReason'].disabled) {
      this.order.cancellationReason = '';
      this.form.controls['cancellationReason'].setValue(
        this.order.cancellationReason,
      );
    }
  }
  onCorrectionReasonClear() {
    if (!this.form.controls['correctionReason'].disabled) {
      this.order.correctionReason = '';
      this.form.controls['correctionReason'].setValue(
        this.order.correctionReason,
      );
    }
  }
  onDescriptionClear() {
    if (!this.form.controls['description'].disabled) {
      this.order.description = '';
      this.form.controls['description'].setValue(this.order.description);
    }
  }

  //статус заказа
  orderStatus() {
    return this.orderService.getOrderStatus(this.order);
  }

  //при изменении адреса работает dadata
  clientAddressChanging(query: string) {
    var additionalQuery: string = '';
    const mydelivery = this.form.controls['delivery'].value as IDelivery;

    var dadataFilterString = '';
    if (mydelivery != null && mydelivery!.dadataFilter)
      dadataFilterString = mydelivery!.dadataFilter;
    if (dadataFilterString)
      additionalQuery = additionalQuery + ' ' + dadataFilterString + ', ';

    this.orderService
      .getDadataAddress(additionalQuery + query, 10)
      .subscribe((res: any) => {
        this.ClientAddressOptionsJSON = res.suggestions;
      });
  }

  clientAddressChanged() {}

  //для корректного отображения select контрола необходима функция сравнения
  compareFunction(o1: any, o2: any) {
    if (o1 == null || o2 == null) return false;
    return o1.id.toString() == o2.id.toString();
  }

  //добавления продукта в заказ
  addProduct() {
    if (
      !this.getVisible('button_items_add') ||
      !this.getEnabled('button_items_add')
    )
      return;

    if (!this.isMainButtonHidden) this.telegramService.MainButton.hide();
    this.zone.run(() => {
      const dialogRef = this.dialog.open<ProductSearchComponent>(
        ProductSearchComponent,
        {
          data: {
            message: 'Добавление позиции в заказ',
            description: 'Выберите продукт и укажите количество',
            cartItem: {
              product: null,
              quantity: 1,
              checked: true,
            },
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (!this.isMainButtonHidden) this.telegramService.MainButton.show();
        if (result && result.flag) {
          let isItemChanged = false;
          const newCartItem = result.cartItem as ICartItem;
          if (newCartItem) {
            this.order.items.forEach((item) => {
              //если такой продукт уже был в корзине то количество увеличиваем
              if (item.product.id == newCartItem.product.id) {
                isItemChanged = true;
                item.quantity += newCartItem.quantity;
                this.order.totalAmount = this.orderService.calculateTotalAmount(
                  this.order?.items,
                );
                this.order.totalCount = this.orderService.calculateTotalCount(
                  this.order?.items,
                );

                if (isItemChanged) {
                  this.isOrderItemsChanged = true;
                  this.order.correctionReason =
                    'Состав заказа изменен в магазине';
                  this.form.controls['correctionReason'].setValue(
                    this.order.correctionReason,
                  );
                }
                return;
              }
            });

            if (!isItemChanged) {
              //если такого продукта не было то добавляем
              isItemChanged = true;
              //console.log(newCartItem);
              this.order.items.push(newCartItem);

              this.order.totalAmount = this.orderService.calculateTotalAmount(
                this.order?.items,
              );
              this.order.totalCount = this.orderService.calculateTotalCount(
                this.order?.items,
              );

              this.isOrderItemsChanged = true;
              this.order.correctionReason = 'Состав заказа изменен в магазине';
              this.form.controls['correctionReason'].setValue(
                this.order.correctionReason,
              );
            }

            this.dataSource = new MatTableDataSource(this.order.items);
          }
        }
      });
    });
  }
  //удаление продукта из заказа
  removeProduct(cartItem: ICartItem) {
    if (
      !this.getVisible('button_items_remove') ||
      !this.getEnabled('button_items_remove')
    )
      return;
    //нельзя удалить последнюю позицию
    if (this.order.items.length <= 1) return;
    this.zone.run(() => {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: 'Удаление?',
            description:
              'Следующий товар: [' +
              cartItem.product.name +
              '] будет удален из заказа. Подтвердите действие.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
          const index = this.order.items.findIndex(
            (p) => p.product.id == cartItem.product.id,
          );
          if (index > -1) {
            this.order.items.splice(index, 1);
            this.isOrderItemsChanged = true;
            this.order.correctionReason = 'Состав заказа изменен в магазине';
            this.form.controls['correctionReason'].setValue(
              this.order.correctionReason,
            );

            this.dataSource = new MatTableDataSource(this.order.items);
            this.order.totalAmount = this.orderService.calculateTotalAmount(
              this.order?.items,
            );
            this.order.totalCount = this.orderService.calculateTotalCount(
              this.order?.items,
            );
          }
        }
      });
    });
  }

  //открытие диалога выбора продукта
  openDialog(cartItem: ICartItem) {
    if (
      !this.getVisible('button_items_replace') ||
      !this.getEnabled('button_items_replace')
    )
      return;

    if (!this.isMainButtonHidden) this.telegramService.MainButton.hide();
    this.zone.run(() => {
      const dialogRef = this.dialog.open<ProductSearchComponent>(
        ProductSearchComponent,
        {
          data: {
            message: 'Замена позиции в заказе',
            description:
              '' +
              (cartItem.product.artikul
                ? 'арт.' + cartItem.product.artikul + ': '
                : '') +
              cartItem.product.name +
              ' - ' +
              cartItem.quantity +
              ' шт.',
            cartItem: cartItem,
          },
        },
      );
      let initialCartItem = structuredClone(cartItem);
      dialogRef.afterClosed().subscribe((result) => {
        if (!this.isMainButtonHidden) this.telegramService.MainButton.show();
        console.log(result);
        if (result && result.flag) {
          let isItemChanged = false;
          const newCartItem = result.cartItem as ICartItem;
          if (newCartItem)
            this.order.items.forEach((item) => {
              if (item.product.id == cartItem.product.id) {
                // console.log(cartItem);
                // console.log(newCartItem);
                if (
                  initialCartItem.product.id != newCartItem.product.id ||
                  initialCartItem.quantity != newCartItem.quantity
                )
                  isItemChanged = true;

                item = newCartItem;
                this.order.totalAmount = this.orderService.calculateTotalAmount(
                  this.order?.items,
                );
                this.order.totalCount = this.orderService.calculateTotalCount(
                  this.order?.items,
                );
                if (isItemChanged) {
                  this.isOrderItemsChanged = true;
                  this.order.correctionReason =
                    'Состав заказа изменен в магазине';
                  this.form.controls['correctionReason'].setValue(
                    this.order.correctionReason,
                  );

                  this.dataSource = new MatTableDataSource(this.order.items);
                }
                return;
              }
            });
        }
      });
    });
  }

  showModalAgreement() {
    this.zone.run(() => {
      const dialogRef = this.dialog.open<AgreementComponent>(
        AgreementComponent,
        {
          data: {
            isModal: true,
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        return;
      });
    });
  }

  showModalPrivacy() {
    this.zone.run(() => {
      const dialogRef = this.dialog.open<PrivacyComponent>(PrivacyComponent, {
        data: {
          isModal: true,
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        return;
      });
    });
  }
}
