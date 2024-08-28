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
import { filter, takeUntil } from 'rxjs';
import { ProductSearchComponent } from '../product-search/product-search.component';
import { MatTableDataSource } from '@angular/material/table';

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

    this.totalAmountOrder = 0;

    this.dataSource = new MatTableDataSource([] as ICartItem[]);

    this.form = fb.group({
      id: [this.order?.id, []],
      items: [this.order?.items, []],
      delivery: [this.order?.delivery!, [Validators.required, this.deliveryValidator]],
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
      clientPhone: [
        this.order?.clientPhone,
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          //Validators.pattern('\([7-9]{1}\d{2}\)\s\d{3}\-\d{2}\-\d{2}'),
        ],
      ],
      clientAddress: [this.order?.clientAddress, [Validators.maxLength(500), Validators.required]],
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
      
      declineReason: [
        this.order?.declineReason,
        [Validators.maxLength(500)],
      ],
      description: [this.order?.description, [Validators.maxLength(500)]],
    });
  }

  // валидатор выбранной доставки
  //необходимо, так как по умолчанию ставится пустая доставка с Id=0 а не null
  deliveryValidator(control: FormControl): {[s:string]:boolean}|null{
         
    if(control.value && (control.value as IDelivery).id<=0){
        return {"delivery": true};
    }
    return null;
  }

  // валидатор адреса доставки
  clientAddressValidator(control: FormControl): {[s:string]:boolean}|null{
         
    if(control.value && control.value === "" && this.isDeliveryRequired()){
        return {"clientAddress": true};
    }
    return null;
  }

  setInitialValue() {
    this.form.controls['id'].setValue(this.order?.id);
    this.form.controls['items'].setValue(this.order?.items);
    this.form.controls['delivery'].setValue(this.order?.delivery);
    this.form.controls['totalAmount'].setValue(this.order?.totalAmount);
    this.form.controls['totalCount'].setValue(this.order?.totalCount);
    this.form.controls['clientName'].setValue(this.order?.clientName);
    this.form.controls['clientTgName'].setValue(this.order?.clientTgName);
    this.form.controls['clientPhone'].setValue(this.order?.clientPhone);
    this.form.controls['clientAddress'].setValue(this.order?.clientAddress);
    this.form.controls['correctionReason'].setValue(
      this.order?.correctionReason,
    );
    this.form.controls['declineReason'].setValue(
      this.order?.declineReason,
    );
    this.form.controls['description'].setValue(this.order?.description);

    this.dataSource = new MatTableDataSource(this.order.items);
  }

  ngOnInit(): void {
    this.setInitialValue();

    // this.form.statusChanges
    // .pipe(
    //   filter(() => this.form.valid),
    //   takeUntil(this.destroy$))
    //   .subscribe(() => this.onFormValid());
    this.form.statusChanges
      .pipe
      //filter(() => this.form.valid)
      ()
      .subscribe(() => this.isFormValid());

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

    //this.destroy$.next();
  }

  private isFormValid() {
    if (
      this.telegramService.IsTelegramWebAppOpened &&
      this.form.valid &&
      (this.order.id == 0 ||
        (this.telegramService.isAdmin && this.order.id > 0))
    ) {     
        //this.telegramService.MainButton.enable();
        this.telegramService.MainButton.show();      
    } else {
      //this.telegramService.MainButton.disable();
      this.telegramService.MainButton.hide();
    }
  }

  //кнопка назад в WebApp telegram
  goBack() {
    //this.location.back();
    this.navigation.back();
  }

  acceptOrder(){
    //редактирование существующего заказа может делать только админ
    if (
      this.telegramService.Id &&
      this.form.valid &&
      this.order.id > 0 &&
      this.telegramService.isAdmin
    ){
      this.order.isAccepted = true;
      this.order.acceptDate = new Date();
      this.sendData();
    }

  }

  declineOrder(){

  }

  completeOrder(){

  }

  sendData() {
    //добавление нового заказа
    if (this.telegramService.Id && this.form.valid && this.order.id == 0) {
      this.disableButton = true;
      this.telegramService.MainButton.setText("Отправка...");
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
            clientPhone: this.form.controls['clientPhone'].value,
            clientAddress: this.isDeliveryRequired()
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
            console.log('addOrder data', data);
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

    //редактирование существующего заказа может делать только админ
    if (
      this.telegramService.Id &&
      this.form.valid &&
      this.order.id > 0 &&
      this.telegramService.isAdmin
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText("Отправка...");
      this.telegramService.MainButton.disable();

      // console.log(this.form.value);
      // console.log(this.order);

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
            clientTgName: this.form.controls['clientTgName'].value,
            clientPhone: this.form.controls['clientPhone'].value,
            clientAddress: this.isDeliveryRequired()
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
            isCorrected: true,
            correctionDate: new Date(),
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
    if (this.order.id > 0)
      this.telegramService.MainButton.setText('Обновить данные');
    else
      this.telegramService.MainButton.setText('Отправить в PROКРАСОТУ');
  }

  deliveryChange(item: IDelivery) {
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

    this.form.controls['clientAddress'].updateValueAndValidity();

    this.totalAmountOrder =
      this.order.totalAmount +
      (item.freeAmount <= this.order.totalAmount ? 0 : item.amount);
  }

  onClientNameClear() {
    this.form.controls['clientName'].setValue('');
  }

  onClientTgNameClear() {
    this.form.controls['clientTgName'].setValue('');
  }
  onClientPhoneClear() {
    this.form.controls['clientPhone'].setValue('');
  }
  onClientAddressClear() {
    this.form.controls['clientAddress'].setValue('');
  }
  onDeclineReasonClear() {
    this.form.controls['declineReason'].setValue('');
  }
  onCorrectionReasonClear() {
    this.form.controls['correctionReason'].setValue('');
  }
  onDescriptionClear() {
    this.form.controls['description'].setValue('');
  }

  isDeliveryRequired() {
    const flag = this.orderService.isDeliveryRequired(
      this.form.controls['delivery'].value as IDelivery,
    );

    if (!flag) this.form.controls['clientAddress'].setErrors(null);

    return flag;

    //return (mydelivery != null && mydelivery!.amount>0);
  }

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
    if (!this.telegramService.isAdmin) return;
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

          this.dataSource = new MatTableDataSource(this.order.items);
        }
      }
    });
  }

  removeProduct(cartItem: ICartItem) {
    if (!this.telegramService.isAdmin) return;
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
    if (!this.telegramService.isAdmin) return;

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

                this.dataSource = new MatTableDataSource(this.order.items);
              }
              return;
            }
          });
      }
    });
  }
}
