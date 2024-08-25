import { Component, Input, OnDestroy, OnInit, Signal, effect } from '@angular/core';
import { IDelivery, IOrder, OrderService } from '../../services/order.service';
import { TelegramService } from '../../services/telegram.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';
import { CartService, ICartItem } from '../../services/cart.service';
import { NavigationService } from '../../services/navigation.service';
import { filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrl: './order-item.component.scss',
})
export class OrderItemComponent implements OnInit, OnDestroy {
  @Input() order!: IOrder;

  form: FormGroup = new FormGroup({});
  displayedColumns: string[] = ['imageUrl', 'description'];

  totalAmountOrder;
  isUserAgreePersonalData: boolean = false;

  disableButton: boolean = false;

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

    // effect(() => {
    //   if (this.form.valid()) {
    //     this.telegramService.MainButton.show();
    //   } else this.telegramService.MainButton.hide();
    // });

    this.totalAmountOrder = 0;
    // id: 0,
    // items: cartValue.items.filter(p=>p.checked),
    // totalAmount: this.calculateTotalAmount(cartValue.items.filter(p=>p.checked) as ICartItem[]),
    // totalCount: this.calculateTotalCount(cartValue.items.filter(p=>p.checked) as ICartItem[]),
    // clientName: "",
    // clientTgName: "",
    // clientPhone: "",
    // clientAddress: "",
    // delivery: {id: 0, name: "", description: "", amount: 0, freeAmount: 0},
    // orderDate: new Date(),
    // isAccepted:false,
    // acceptDate: new Date(),
    // isCompleted: false,
    // completeDate: new Date(),
    // isDeclined: false,
    // declineDate: new Date(),
    // declineReason: "",
    // isCorrected: false,
    // correctionDate: new Date(),
    // coorectionReason:"",
    // description:"",

    
    // console.log(this.order);
    // console.log(this.order?.delivery!);
    this.form = fb.group({
      id: [this.order?.id, []],
      items: [this.order?.items, []],
      delivery: [this.order?.delivery!, [Validators.required]],
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
      clientAddress: [
        this.order?.clientAddress,
        [
          Validators.maxLength(500),
        ],
      ],
      isAgeePersonalData: [
        this.isUserAgreePersonalData,
        [
          Validators.requiredTrue,
        ],
      ],
    });
    
  }

  setInitialValue(){
    this.form.controls['id'].setValue(this.order?.id);
    this.form.controls['items'].setValue(this.order?.items);
    this.form.controls['delivery'].setValue(this.order?.delivery);
    this.form.controls['totalAmount'].setValue(this.order?.totalAmount);
    this.form.controls['totalCount'].setValue(this.order?.totalCount);
    this.form.controls['clientName'].setValue(this.order?.clientName);
    this.form.controls['clientTgName'].setValue(this.order?.clientTgName);
    this.form.controls['clientPhone'].setValue(this.order?.clientPhone);
    this.form.controls['clientAddress'].setValue(this.order?.clientAddress);
  }

  ngOnInit(): void {

    this.setInitialValue();

   

    // this.form.statusChanges
    // .pipe(
    //   filter(() => this.form.valid),
    //   takeUntil(this.destroy$))
    //   .subscribe(() => this.onFormValid());
    this.form.statusChanges
    .pipe(
      //filter(() => this.form.valid)
      )
      .subscribe(() => this.isFormValid());

    
    
    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе

    this.telegramService.MainButton.setText('Отправить в PROКРАСОТУ');
  }

  ngOnDestroy(): void {
    this.telegramService.BackButton.hide();
    this.telegramService.BackButton.offClick(this.goBack);
    this.telegramService.MainButton.hide();

    //this.destroy$.next();
  }

  private isFormValid() {
    //console.log('form is valid: '+this.form.valid)
    if (this.form.valid) 
    {
      if (!this.telegramService.MainButton.isVisible) this.telegramService.MainButton.show();
    } else 
    {
      if (this.telegramService.MainButton.isVisible) this.telegramService.MainButton.hide();
    }
  }

  goBack() {
    //this.location.back();
    this.navigation.back();
  }

  sendData() {
    

    if (this.telegramService.Id && this.form.valid) 
    {
      this.disableButton = true;

      // this.telegramService.sendToGoogleAppsScript({
      //   chat_id: this.telegramService.Id, 
      //   userName: this.telegramService.UserName, 
      //   action: "addOrder", 
      //   order: {
      //   id:0,
      //   items: this.order?.items,
      //   totalAmount: this.orderService.calculateTotalAmount(this.order?.items),
      //   totalCount: this.orderService.calculateTotalCount(this.order?.items),
      //   clientName: this.form.controls['clientName'].value,
      //   clientTgName: this.form.controls['clientTgName'].value,
      //   clientPhone: this.form.controls['clientPhone'].value,
      //   clientAddress: this.form.controls['clientAddress'].value,
      //   delivery: this.form.controls['delivery'].value as IDelivery,
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
      //   coorectionReason:"",
      //   description:""
      // }
      this.orderService.sendOrderToGoogleAppsScript(
        this.telegramService.Id, 
        this.telegramService.UserName, 
        "addOrder", 
        {
        id:0,
        items: this.order?.items,
        totalAmount: this.orderService.calculateTotalAmount(this.order?.items),
        totalCount: this.orderService.calculateTotalCount(this.order?.items),
        clientName: this.form.controls['clientName'].value,
        clientTgName: this.form.controls['clientTgName'].value,
        clientPhone: this.form.controls['clientPhone'].value,
        clientAddress: this.form.controls['clientAddress'].value,
        delivery: this.form.controls['delivery'].value as IDelivery,
        orderDate: new Date(),
        isAccepted:false,
        acceptDate: new Date(),
        isCompleted: false,
        completeDate: new Date(),
        isDeclined: false,
        declineDate: new Date(),
        declineReason: "",
        isCorrected: false,
        correctionDate: new Date(),
        coorectionReason:"",
        description:""
      }
    ).subscribe(
      
      {
        next: (data)=>{
          console.log('addOrder data',data)
        },
        error: (err)=>{
          this.onHandleUpdate();
          console.log('addOrder error',err);
        },
        complete:()=>{
          
          
          //обновляем корзину
          this.order?.items.forEach(item =>{
            this.cartService.$cart.update((currentCart) => {
              const existingItem = currentCart.items.find(
                (i) => i.product.id === item.product.id,
              );
              if (!existingItem) 
              {
                return currentCart
              } 
              else
              {
                if (existingItem.quantity - item.quantity < 0) {
                  item.quantity = existingItem.quantity;
                }
                existingItem.quantity -= item.quantity;
              }
        
              currentCart.items = currentCart.items.filter((p) => p.quantity > 0);

              currentCart.totalCount = this.cartService.calculateTotalCount(currentCart.items);
              currentCart.totalAmount = this.cartService.calculateTotalAmount(currentCart.items);
              
              return currentCart;
            });            
          });
          if (this.telegramService.Id) {
            this.cartService.sendCartToGoogleAppsScript(
              this.telegramService.Id,
              this.telegramService.UserName,
              'removeCart',
              this.cartService.$cart(),
            ).subscribe(
              {
                next: (data)=>{
                  console.log('removeCart data',data)
                },
                error: (err)=>{
                  console.log('removeCart error',err);
                },
                complete:()=>{
                  console.log('removeCart complete');
                  console.log(this.cartService.$cart());
                }
              }
            );
          }

          this.onHandleUpdate();

          console.log('addOrder complete');
          this.router.navigate(['/']);
          if (this.telegramService.IsTelegramWebAppOpened)
            this.telegramService.tg.close();
          
        }
      }
    // (response) => 
    // {
    //   console.log('SUCCESS');
    //   console.log(response);
    //   this.onHandleUpdate();
    // }
    );
    }
    

    // setTimeout(() => {
    //   this.onHandleUpdate();
    //   console.log(this.form.value);
    // }, 1000);
  //}
  }

  onHandleUpdate() {
    this.disableButton = false;
  }

  openForEdit(userId: string) {
    this.router.navigate(['/admin/user/edit/' + userId]);
  }

  deliveryChange(item: IDelivery) {
    //this.order.totalAmount = this.orderService.calculateTotalAmount(this.order.items);
    this.totalAmountOrder =
      this.order.totalAmount +
      (item.freeAmount <= this.order.totalAmount ? 0 : item.amount);
    //console.log(this.form.controls['delivery'].value);
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

  
  isDeliveryRequired() {
    const mydelivery = this.form.controls['delivery'].value as IDelivery;
    if (!mydelivery) return false;
    if (mydelivery.name.toLowerCase() == "самовывоз") return false;
    return true;

    //return (mydelivery != null && mydelivery!.amount>0);
  }

  clientAddressChanging(query:string){
    
    var additionalQuery: string="";
    //if(this.onlyUfaSearch)additionalQuery=additionalQuery+" Уфа, ";
    //if(this.onlyBashSearch)additionalQuery=additionalQuery+" Башкортостан, ";
    const mydelivery = this.form.controls['delivery'].value as IDelivery;
    var dadataFilterString = "";
    if (mydelivery != null && mydelivery!.dadataFilter) dadataFilterString = mydelivery!.dadataFilter;
    if (dadataFilterString) additionalQuery=additionalQuery+" "+dadataFilterString+", ";

    this.orderService.getDadataAddress(additionalQuery+query, 10).subscribe(
    (res:any) =>{
      this.ClientAddressOptionsJSON = res.suggestions;  
    });
     
  }

  clientAddressChanged(){ 
  }

  compareFunction(o1: any, o2: any) {
    
    if (o1==null || o2==null) return false;
    return (o1.id.toString() == o2.id.toString());
  }

  // onDeleteItem(cartItem: ICartItem) {
  //   const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
  //     ConfirmDialogDemoComponent,
  //     {
  //       data: {
  //         message: 'Удаление?',
  //         description:
  //           'Следующий товар: [' +
  //           cartItem.product.name +
  //           '] будет удален из заказа. Подтвердите действие.',
  //       },
  //     },
  //   );
  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result == true) {
  //       const newItem: ICartItem = {
  //         product: cartItem.product,
  //         quantity: cartItem.quantity,
  //         checked: cartItem.checked,
  //       };

  //       this.orderService.removeItem(newItem);
  //       // const index =this.order.items.indexOf(cartItem);
  //       // if (index > -1) { // only splice array when item is found
  //       //   this.order.items.splice(index, 1); // 2nd parameter means remove one item only
  //       //   console.log(this.order.items);
  //       // }

  //       // this.service.deleteUser(id).then(res => {
  //       //   this.refreshList();
  //       //   this.toastr.warning("Пользователь удален", "CheckIn7 - Запись онлайн");
  //       // });
  //     }
  //   });
  // }
}
