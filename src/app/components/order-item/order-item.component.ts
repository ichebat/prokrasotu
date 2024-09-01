import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  Signal,
  booleanAttribute,
  effect,
} from '@angular/core';
import { IDelivery, IOrder, OrderService } from '../../services/order.service';
import { TelegramService } from '../../services/telegram.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';
import { CartService, ICartItem } from '../../services/cart.service';
import { NavigationService } from '../../services/navigation.service';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs';
import { ProductSearchComponent } from '../product-search/product-search.component';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrl: './order-item.component.scss',
})
export class OrderItemComponent implements OnInit, OnDestroy {
  @Input() order!: IOrder;

  form: FormGroup = new FormGroup({});
  dataSource: MatTableDataSource<ICartItem>; //dataSource для mat-table на форме

  displayedColumns: string[] = ['imageUrl', 'description', 'ActionBar']; //список колонок для отображения

  totalAmountOrder; //общая стоимость заказа с учетом доставки
  isUserAgreePersonalData: boolean = false; //для галочки с ПД
  isOrderItemsChanged: boolean = false; //менялся ли состав заказа
  isDeliveryChanged: boolean = false; //менялась ли доставка

  isMainButtonHidden = true;

  FormControlsFlags: any = [
    { controlName: 'delivery', visible: true, enabled: true },
    { controlName: 'clientAddress', visible: true, enabled: true },
    { controlName: 'clientName', visible: true, enabled: true },
    { controlName: 'clientTgName', visible: true, enabled: true },
    { controlName: 'clientTgChatId', visible: true, enabled: true },
    { controlName: 'clientPhone', visible: true, enabled: true },
    { controlName: 'correctionReason', visible: true, enabled: true },
    { controlName: 'declineReason', visible: true, enabled: true },
    { controlName: 'description', visible: true, enabled: true },
    { controlName: 'isAgeePersonalData', visible: true, enabled: true },

    { controlName: 'button_items_add', visible: true, enabled: true },
    { controlName: 'button_items_remove', visible: true, enabled: true },
    { controlName: 'button_items_replace', visible: true, enabled: true },
    { controlName: 'button_submit', visible: true, enabled: true },
    { controlName: 'button_close', visible: true, enabled: true },
    { controlName: 'button_accept', visible: true, enabled: true },
    { controlName: 'button_complete', visible: true, enabled: true },
    { controlName: 'button_decline', visible: true, enabled: true },
  ];

  disableButton: boolean = false; //отключает кнопки на время отправки данных

  ClientAddressOptionsJSON; //для работы с dadata

  constructor(
    public orderService: OrderService,
    public cartService: CartService,
    public telegramService: TelegramService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private navigation: NavigationService,
    private fb: FormBuilder,
  ) {
    //биндим функции, чтобы от них потом корректно отписаться
    this.goBack = this.goBack.bind(this);
    this.sendData = this.sendData.bind(this);

    //ниже привязка действия к MainButton телеграм
    //если существующий заказ просматривает не админ, то его можно только отменить
    const sendDataToTelegram = () => {
      //if (this.order.id > 0 && !this.telegramService.isAdmin) {
      if (this.getVisible('button_close') && this.getEnabled('button_close')) {
        this.closeForm();
      } else if (
        this.getVisible('button_submit') &&
        this.getEnabled('button_submit')
      ) {
        this.sendData();
      }
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

    this.totalAmountOrder = 0;

    this.dataSource = new MatTableDataSource([] as ICartItem[]);

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
          Validators.pattern('[A-Za-zА-Яа-я0-9-_ ]{2,50}'),
        ],
      ],
      clientTgName: [
        this.telegramService.UserName,
        [
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern('[A-Za-zА-Яа-я0-9-_ ]{2,50}'),
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
      clientAddress: [
        this.order?.clientAddress,
        [Validators.maxLength(500)],
      ],
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

      declineReason: [this.order?.declineReason, [Validators.maxLength(500)]],
      description: [this.order?.description, [Validators.maxLength(500)]],
    });

    // this.form.statusChanges.subscribe(newStatus=> {
    //   console.log('form status changed')
    //   console.log(newStatus)
    //   this.isFormValid()
    // })
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
    if (control.value && control.value === '' && this.order.delivery.isAddressRequired) {
      return { clientAddress: true };
    }
    return null;
  }

  setInitialValue() {
    this.form.controls['id'].setValue(this.order?.id);
    this.form.controls['items'].setValue(this.order?.items);
    this.form.controls['delivery'].setValue(this.order?.delivery), //{value: this.order?.delivery, disabled: (this.order?.isAccepted || this.order?.isCompleted || this.order?.isDeclined)});
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
    this.form.controls['declineReason'].setValue(this.order?.declineReason);
    this.form.controls['description'].setValue(this.order?.description);

    console.log(this.order);

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
          item.controlName == 'declineReason' ||
          item.controlName == 'description' ||
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept' ||
          item.controlName == 'button_complete' ||
          item.controlName == 'button_decline' ||
          item.controlName == 'button_close'
        ) {
          item.visible = false;
        }

        //возможность редактирования следующих контролов будет изменена
        if (
          item.controlName == 'clientTgName' ||
          item.controlName == 'clientTgChatId' ||
          item.controlName == 'correctionReason' ||
          item.controlName == 'declineReason' ||
          item.controlName == 'description' ||
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept' ||
          item.controlName == 'button_complete' ||
          item.controlName == 'button_decline' ||
          item.controlName == 'button_close'
        ) {
          item.enabled = false;
        }
      }

      //2. ******************************************* */
      //если создается новый заказ ЧЕРЕЗ телеграм бота (НЕ через сайт)
      if (this.telegramService.IsTelegramWebAppOpened && this.order?.id == 0) {
        //отображение следующих контролов будет изменено
        if (
          item.controlName == 'correctionReason' ||
          item.controlName == 'declineReason' ||
          item.controlName == 'description' ||
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept' ||
          item.controlName == 'button_complete' ||
          item.controlName == 'button_decline' ||
          item.controlName == 'button_close'
        ) {
          item.visible = false;
        }
        if (item.controlName == 'clientTgName') {
          item.visible = true && this.telegramService.UserName;
        }
        if (item.controlName == 'clientTgChatId') {
          item.visible = true && this.telegramService.Id;
        }

        //возможность редактирования следующих контролов будет изменена
        if (
          item.controlName == 'correctionReason' ||
          item.controlName == 'declineReason' ||
          item.controlName == 'description' ||
          item.controlName == 'clientTgName' ||
          item.controlName == 'clientTgChatId' ||
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept' ||
          item.controlName == 'button_complete' ||
          item.controlName == 'button_decline' ||
          item.controlName == 'button_close'
        ) {
          item.enabled = false;
        }
      }

      //3. ******************************************* */
      //если заказ редактируется ЧЕРЕЗ телеграм бота (НЕ через сайт)
      if (this.telegramService.IsTelegramWebAppOpened && this.order?.id > 0) {
        //отображение следующих контролов будет изменено
        if (item.controlName == 'clientTgName') {
          item.visible = true && this.order?.clientTgName;
        }
        if (item.controlName == 'clientTgChatId') {
          item.visible = true && this.order?.clientTgChatId;
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
            !this.order?.isDeclined &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_complete') {
          item.visible =
            true &&
            this.telegramService.isAdmin &&
            this.order?.isAccepted &&
            !this.order?.isDeclined &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_decline') {
          item.visible =
            true && !this.order?.isDeclined && !this.order?.isCompleted;
        }
        if (item.controlName == 'button_submit') {
          item.visible =
            true &&
            this.telegramService.isAdmin &&
            !this.order?.isDeclined &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_close') {
          item.visible =
            true &&
            (!this.telegramService.isAdmin ||
              this.order?.isDeclined ||
              this.order?.isCompleted);
        }

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
          item.enabled = true && this.telegramService.isAdmin;
        }
        if (item.controlName == 'correctionReason') {
          item.enabled = true && this.telegramService.isAdmin;
        }
        if (item.controlName == 'description') {
          item.enabled = true && this.telegramService.isAdmin;
        }
        if (
          item.controlName == 'button_items_add' ||
          item.controlName == 'button_items_remove' ||
          item.controlName == 'button_items_replace' ||
          item.controlName == 'button_accept'
        ) {
          item.enabled =
            true &&
            this.telegramService.isAdmin &&
            !this.order?.isAccepted &&
            !this.order?.isDeclined &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_complete') {
          item.enabled =
            true &&
            this.telegramService.isAdmin &&
            this.order?.isAccepted &&
            !this.order?.isDeclined &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_decline') {
          item.enabled =
            true && !this.order?.isDeclined && !this.order?.isCompleted;
        }
        if (item.controlName == 'button_submit') {
          item.enabled =
            true &&
            this.telegramService.isAdmin &&
            !this.order?.isDeclined &&
            !this.order?.isCompleted;
        }
        if (item.controlName == 'button_close') {
          item.enabled =
            true &&
            (!this.telegramService.isAdmin ||
              this.order?.isDeclined ||
              this.order?.isCompleted);
        }
      }

      //4. ******************************************* */
      //если заказ редактируется не через телеграм бота (через сайт)
      if (!this.telegramService.IsTelegramWebAppOpened && this.order?.id > 0) {
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

    // if (this.telegramService.IsTelegramWebAppOpened &&
    //   (!this.telegramService.isAdmin ||
    //   this.order?.isAccepted ||
    //   this.order?.isCompleted ||
    //   this.order?.isDeclined)
    // ) {
    //   this.form.controls['delivery'].disable();
    //   this.form.controls['clientAddress'].disable();
    //   this.form.controls['clientName'].disable();
    //   this.form.controls['clientTgName'].disable();
    //   this.form.controls['clientTgChatId'].disable();
    //   this.form.controls['clientPhone'].disable();

    //   if (!this.telegramService.isAdmin) {
    //     this.form.controls['correctionReason'].disable();
    //     this.form.controls['description'].disable();
    //   }
    // }
  }

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

    // this.form.statusChanges
    // .pipe(
    //   filter(() => this.form.valid),
    //   takeUntil(this.destroy$))
    //   .subscribe(() => this.onFormValid());

    //   this.form.statusChanges.subscribe(newStatus=> {
    //     console.log('firstname status changed')
    //     console.log(newStatus)                                    //latest status
    //     console.log(this.form.get("id")?.status)   //latest status
    //     console.log(this.form.status)                    //Previous status

    //     setTimeout(() => {
    //       console.log(this.form.status)                  //latest status
    //     })

    //  })

    this.form.statusChanges
      .pipe(distinctUntilChanged())
      //  .pipe
      // (filter(() => this.form.valid))
      //()
      .subscribe(() => {
        console.log(this.form.status);
        this.isFormValid();
        // setTimeout(() => {
        // console.log(this.form.status)
        // this.isFormValid()
        // })
      });
    this.form.updateValueAndValidity();

    //this.formControlValueChanged() // Note if you are doing an edit/fetching data from an observer this must be called only after your form is properly initialized otherwise you will get error.

    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе

    this.onHandleUpdate();
  }

  
  //   formControlValueChanged(): void {
  //     this.form.valueChanges.subscribe(value => {
  //         console.log('value changed', value)
  //     })
  // }

  ngOnDestroy(): void {
    this.telegramService.BackButton.hide();
    this.telegramService.BackButton.offClick(this.goBack);
    this.telegramService.MainButton.hide();
    this.isMainButtonHidden = true;


    //this.destroy$.next();
  }

  private isFormValid() {
    if (
      //this.telegramService.IsTelegramWebAppOpened &&
      this.form.valid // && (this.order.id == 0 || (this.telegramService.isAdmin && this.order.id > 0) ))
    ) {
      //this.telegramService.MainButton.enable();
      this.telegramService.MainButton.show();
      this.isMainButtonHidden = false;
    } else {
      //this.telegramService.MainButton.disable();
      this.telegramService.MainButton.hide();
      this.isMainButtonHidden = true;
    }

    // if (this.telegramService.IsTelegramWebAppOpened && !this.telegramService.isAdmin && this.order.id > 0)
    //   {
    //     //в режиме не админ кнопка будет закрывать форму и должна отображаться
    //     this.telegramService.MainButton.show();
    //     this.isMainButtonHidden = false;
    //   }
  }

  //кнопка назад в WebApp telegram
  goBack() {
    //this.location.back();
    this.navigation.back();
  }

  acceptOrder() {
    //принятым считается заказ который не был принят ранее и не отклонен
    //if (this.order.isAccepted || this.order.isDeclined) return;
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
      } else {
        this.order.isAccepted = true;
        this.order.acceptDate = new Date();
        this.sendData();
      }
    }
  }

  declineOrder() {
    //отклонить можно если не отклонялся ранее
    //if (this.order.isDeclined) return;
    if (
      !this.getVisible('button_decline') ||
      !this.getEnabled('button_decline')
    )
      return;

    
    const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
      ConfirmDialogDemoComponent,
      {
        data: {
          message: 'Заказ отменяется',
          description:
            'Причина отмены заказа: [' +
            (this.form.controls['declineReason'].value
              ? this.form.controls['declineReason'].value.toString()
              : 'Не указана') +
            ']. Можно изменить причину перед отправкой. Если все устраивает - подтвердите действие.',
        },
      },
    );
    dialogRef.afterClosed().subscribe((result) => {
      
      if (result == true) {
        this.order.isDeclined = true;
        this.order.declineDate = new Date();
        this.order.declineReason = this.form.controls['declineReason'].value;
        this.sendData();
      } else return;
    });
  }

  completeOrder() {
    //завершить можно если заказ был принят и не отклонялся позднее
    //if (!this.order.isAccepted || this.order.isCompleted) return;
    if (
      !this.getVisible('button_complete') ||
      !this.getEnabled('button_complete')
    )
      return;
      
    
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
  }

  closeForm() {
    if (!this.getVisible('button_close') || !this.getEnabled('button_close'))
      return;
    this.router.navigate(['/']);
    if (this.telegramService.IsTelegramWebAppOpened)
      this.telegramService.tg.close();
  }

  sendData() {
    //добавление нового заказа
    if (!this.getVisible('button_submit') || !this.getEnabled('button_submit'))
      return;

    // if (
    //   (this.telegramService.Id || !environment.useOnlyTgOrders) &&
    //   this.order.id == 0 &&
    //   this.form.valid
    // )
    if (
      this.order.id == 0 &&
      this.getVisible('button_submit') &&
      this.getEnabled('button_submit') &&
      this.form.valid
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText('Отправка...');
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
            isDeclined: false,
            declineDate: new Date(),
            declineReason: '',
            isCorrected: false,
            correctionDate: new Date(),
            correctionReason: '',
            description: this.form.controls['description'].value,
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
              addOrder_response?.data?.action.toString().toLowerCase() == 'addorder'
            ) {
              const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
                ConfirmDialogDemoComponent,
                {
                  data: {
                    message: addOrder_response.message,
                    description:
                      'Номер вашего заказа: [' +
                      addOrder_response.data.id +
                      ']. Пожалуйста, запомните его. Для продолжения нажмите любую кнопку.',
                  },
                },
              );
              dialogRef.afterClosed().subscribe((result) => {
                if (result == true) {
                  
                } else return;
              });
            }
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
            console.log('addOrder complete');
            this.router.navigate(['/']);
            if (this.telegramService.IsTelegramWebAppOpened)
              this.telegramService.tg.close();
          },
        });
    }

    //редактирование существующего заказа может делать только админ и только через Tg, или же сам пользователь
    // if (
    //   this.telegramService.Id &&
    //   this.form.valid &&
    //   this.order.id > 0 &&
    //   (this.telegramService.isAdmin ||
    //     this.telegramService.Id == this.order?.clientTgChatId)
    // )
    if (
      this.getVisible('button_submit') &&
      this.getEnabled('button_submit') &&
      this.form.valid &&
      this.order.id > 0
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText('Отправка...');
      this.telegramService.MainButton.disable();

      // console.log("this.isDeliveryChanged "+this.isDeliveryChanged);
      // console.log("this.isOrderItemsChanged "+this.isOrderItemsChanged);

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
            // clientTgName: this.form.controls['clientTgName'].value,
            // clientTgChatId: this.form.controls['clientTgChatId'].value,
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
            isDeclined: this.order?.isDeclined,
            declineDate: this.order?.declineDate,
            declineReason: this.form.controls['declineReason'].value,
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

  onHandleUpdate() {
    this.disableButton = false;
    this.telegramService.MainButton.enable();
    if (this.getVisible('button_close') && this.getEnabled('button_close'))
      this.telegramService.MainButton.setText('Закрыть');
    else if (
      this.getVisible('button_submit') &&
      this.getEnabled('button_submit')
    ) {
      if (this.order.id > 0) {
        this.telegramService.MainButton.setText('Обновить данные');
      } else {
        this.telegramService.MainButton.setText('Отправить в PROКРАСОТУ');
      }
    }

    // if (this.order.id > 0) {
    //   //не админ может только отменить заказ
    //   //if (!this.telegramService.isAdmin)
    //   if (this.getVisible("button_close") && this.getEnabled("button_close"))
    //     this.telegramService.MainButton.setText('Закрыть');
    //   else
    //   if (this.getVisible("button_submit") && this.getEnabled("button_submit"))
    //   this.telegramService.MainButton.setText('Обновить данные');
    // } else this.telegramService.MainButton.setText('Отправить в PROКРАСОТУ');
  }

  deliveryChange(item: IDelivery) {
    this.isDeliveryChanged = true;
    this.order.correctionReason =
      'Заказ изменен в магазине: Изменена доставка в заказе';
    this.form.controls['correctionReason'].setValue(
      this.order.correctionReason,
    );
    // console.log(item);
    // this.form.controls['clientAddress'].clearValidators();
    // if (this.isDeliveryRequired()) {
    //   this.form.controls['clientAddress'].setValidators([
    //     Validators.required,
    //     Validators.maxLength(500),
    //   ]);
    // }
    // else
    // {
    //   this.form.controls['clientAddress'].setValidators([
    //     Validators.maxLength(500),
    //   ]);
    // }

    
    this.order.delivery = item;
    if (this.order.delivery.isAddressRequired)
    {
      this.form.controls['clientAddress'].clearValidators();
      this.form.controls['clientAddress'].setValidators([
            Validators.required,
            Validators.maxLength(500),
          ]);
    }else
    {
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
    if (!this.form.controls['clientName'].disabled)
      {
        this.order.clientName = '';
        this.form.controls['clientName'].setValue(this.order.clientName,);
      }
  }

  onClientTgNameClear() {
    if (!this.form.controls['clientTgName'].disabled)
      {
        this.order.clientTgName = '';
        this.form.controls['clientTgName'].setValue(this.order.clientTgName,);
      }
  }
  onClientTgChatIdClear() {
    if (!this.form.controls['clientTgChatId'].disabled)
      {
        this.order.clientTgChatId = '';
        this.form.controls['clientTgChatId'].setValue(this.order.clientTgChatId,);
      }
  }
  onClientPhoneClear() {
    if (!this.form.controls['clientPhone'].disabled)
      {
        this.order.clientPhone = '';
        this.form.controls['clientPhone'].setValue(this.order.clientPhone,);
      }
  }
  onClientAddressClear() {
    if (!this.form.controls['clientAddress'].disabled)
      {
        this.order.clientAddress = '';
        this.form.controls['clientAddress'].setValue(this.order.clientAddress,);
      }
  }
  onDeclineReasonClear() {
    if (!this.form.controls['declineReason'].disabled)
      {
        this.order.declineReason = '';
        this.form.controls['declineReason'].setValue(this.order.declineReason,);
      }
  }
  onCorrectionReasonClear() {
    if (!this.form.controls['correctionReason'].disabled)
    {
      this.order.correctionReason = '';
      this.form.controls['correctionReason'].setValue(this.order.correctionReason,);
    }
  }
  onDescriptionClear() {
    if (!this.form.controls['description'].disabled)
      {
        this.order.description = '';
        this.form.controls['description'].setValue(this.order.description,);
      }
  }

  // isDeliveryRequired() {
  //   const flag = this.orderService.isDeliveryRequired(
  //     this.form.controls['delivery'].value as IDelivery,
  //   );

  //   if (!flag) this.form.controls['clientAddress'].setErrors(null);

  //   return flag;

  //   //return (mydelivery != null && mydelivery!.amount>0);
  // }

  orderStatus() {
    return this.orderService.getOrderStatus(this.order);
  }

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

  compareFunction(o1: any, o2: any) {
    if (o1 == null || o2 == null) return false;
    return o1.id.toString() == o2.id.toString();
  }

  addProduct() {
    // if (!this.telegramService.isAdmin) return;
    // if (
    //   this.order.isAccepted ||
    //   this.order.isCompleted ||
    //   this.order.isDeclined
    // )
    //   return;
    if (
      !this.getVisible('button_items_add') ||
      !this.getEnabled('button_items_add')
    )
      return;

    if (!this.isMainButtonHidden) this.telegramService.MainButton.hide();
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
                // this.order.isCorrected = true;
                // this.order.correctionDate = new Date();
                // this.order.correctionReason = '';
                // this.order.declineReason = '';
                // this.form.controls['isCorrected'].setValue(true);
                // this.form.controls['correctionDate'].setValue(new Date());
                // this.form.controls['correctionReason'].setValue('');
                // this.form.controls['declineReason'].setValue('');
              }
              return;
            }
          });

          //если такого продукта не было то добавляем
          isItemChanged = true;
          console.log(newCartItem);
          this.order.items.push(newCartItem);

          this.order.totalAmount = this.orderService.calculateTotalAmount(
            this.order?.items,
          );
          this.order.totalCount = this.orderService.calculateTotalCount(
            this.order?.items,
          );

          // this.form.controls['isCorrected'].setValue(true);
          // this.form.controls['correctionDate'].setValue(new Date());
          // this.form.controls['declineReason'].setValue('');
          // this.form.controls['correctionReason'].setValue('');

          // this.order.isCorrected = true;
          // this.order.correctionDate = new Date();
          // this.order.declineReason = '';
          // this.order.correctionReason = '';

          this.isOrderItemsChanged = true;
          this.order.correctionReason = 'Состав заказа изменен в магазине';
          this.form.controls['correctionReason'].setValue(
            this.order.correctionReason,
          );

          this.dataSource = new MatTableDataSource(this.order.items);
        }
      }
    });
  }

  removeProduct(cartItem: ICartItem) {
    // if (!this.telegramService.isAdmin) return;
    // if (
    //   this.order.isAccepted ||
    //   this.order.isCompleted ||
    //   this.order.isDeclined
    // )
    //   return;
    if (
      !this.getVisible('button_items_remove') ||
      !this.getEnabled('button_items_remove')
    )
      return;
    //нельзя удалить последнюю позицию
    if (this.order.items.length <= 1) return;
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
          // this.order.isCorrected = true;
          // this.order.correctionDate = new Date();
          // this.order.declineReason = '';
          // this.order.correctionReason = '';
          // this.form.controls['isCorrected'].setValue(true);
          // this.form.controls['correctionDate'].setValue(new Date());
          // this.form.controls['declineReason'].setValue('');
          // this.form.controls['correctionReason'].setValue('');
        }
      }
    });
  }

  openDialog(cartItem: ICartItem) {
    //менять позиции можно только если админ и заказ еще не обработан
    // if (!this.telegramService.isAdmin) return;
    // if (
    //   this.order.isAccepted ||
    //   this.order.isCompleted ||
    //   this.order.isDeclined
    // )
    //   return;
    if (
      !this.getVisible('button_items_replace') ||
      !this.getEnabled('button_items_replace')
    )
      return;

    if (!this.isMainButtonHidden) this.telegramService.MainButton.hide();
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
    dialogRef.afterClosed().subscribe((result) => {
    if (!this.isMainButtonHidden) this.telegramService.MainButton.show();
      //console.log(result);
      if (result && result.flag) {
        let isItemChanged = false;
        const newCartItem = result.cartItem as ICartItem;
        if (newCartItem)
          this.order.items.forEach((item) => {
            if (item.product.id == cartItem.product.id) {
              if (
                cartItem.product.id != newCartItem.product.id ||
                cartItem.quantity != newCartItem.quantity
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
                // this.form.controls['isCorrected'].setValue(true);
                // this.form.controls['correctionDate'].setValue(new Date());
                // this.form.controls['declineReason'].setValue('');
                // this.form.controls['correctionReason'].setValue('');
                // this.order.isCorrected = true;
                // this.order.correctionDate = new Date();
                // this.order.declineReason = '';
                // this.order.correctionReason = '';
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
  }
}
