import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IDelivery, IOrder, OrderService } from '../../services/order.service';
import { TelegramService } from '../../services/telegram.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';
import { CartService, ICartItem } from '../../services/cart.service';

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
    private telegramService: TelegramService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private fb: FormBuilder,
  ) {
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

    

    this.form = fb.group({
      id: [this.order?.id, []],
      items: [this.order?.items, []],
      delivery: [this.order?.delivery, [Validators.required]],
      totalAmount: [this.order?.totalAmount, []],
      totalCount: [this.order?.totalCount, []],
      clientName: [
        this.order?.clientName,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern('[A-Za-zА-Яа-я0-9-_]{2,50}'),
        ],
      ],
      clientTgName: [
        this.telegramService.UserName,
        [
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern('[A-Za-zА-Яа-я0-9-_]{2,50}'),
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

  ngOnInit(): void {
    //throw new Error('Method not implemented.');
  }
  ngOnDestroy(): void {
    //throw new Error('Method not implemented.');
  }

  sendData() {
    this.disableButton = true;

    setTimeout(() => {
      this.onHandleUpdate();
      console.log(this.form.value);
    }, 1000);
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

    return (mydelivery != null && mydelivery!.amount>0);
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
