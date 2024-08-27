import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TelegramService } from '../../services/telegram.service';
import { NavigationService } from '../../services/navigation.service';
import { OrderService } from '../../services/order.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService, ICartItem } from '../../services/cart.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogDemoComponent } from '../../components/confirm-dialog-demo/confirm-dialog-demo.component';
import { ProductSearchComponent } from '../../components/product-search/product-search.component';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss',
})
export class OrderComponent implements OnInit, OnDestroy {
  
  //idParam;

  disableButton: boolean = false;

  @Input() set id(id: string) { 
    this.orderService.updateId(id);      
  }

  
  /**
   *
   */
  constructor(
    private telegramService: TelegramService,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private router: Router,
    public cartService: CartService,
    public orderService: OrderService,
    public dialog: MatDialog,
    private fb: FormBuilder,
  ) {
    //const idParam = this.route.snapshot.paramMap.get('id');
    //this.idParam = this.route.snapshot.paramMap.get('id');
    this.orderService.updateId(this.id);

    // export interface IOrder {
    //   id: number;
    //   items: ICartItem[];
    //   totalAmount: number;
    //   totalCount: number;
    //   clientName: string;
    //   clientTgName: string;
    //   clientPhone: string;
    //   clientAddress: string;
    //   delivery: IDelivery;
    //   orderDate: Date;
    //   isAccepted: boolean;
    //   acceptDate: Date;
    //   isCompleted: boolean;
    //   completeDate: Date;
    //   isDeclined: boolean;
    //   declineDate: Date;
    //   declineReason: string;
    //   isCorrected: boolean;
    //   correctionDate: Date;
    //   correctionReason: string;
    //   description: string;
    // }
  //   if (this.id)
  //   {
  //     this.orderService.setOrderSignal(this.orderService.$order()!);

  //   this.form = fb.group({
  //     id: [this.orderService.$order()?.id, []],
  //     items: [this.orderService.$order()?.items,[Validators.required]],
  //     delivery: [this.orderService.$order()?.delivery, [Validators.required]],
  //   });
  // }
  // else{
  //   this.orderService.setOrderSignal({
  //     id: 0,
  //     items: this.cartService.$cart().items.filter(p=>p.checked),
  //     totalAmount: this.orderService.calculateTotalAmount(this.cartService.$cart().items.filter(p=>p.checked)),
  //     totalCount: this.orderService.calculateTotalCount(this.cartService.$cart().items.filter(p=>p.checked)),
  //     clientName: "",
  //     clientTgName: this.telegramService.UserName,
  //     clientPhone: "",
  //     clientAddress: "",
  //     delivery: {id: 0, name: "", description: "", amount: 0, freeAmount: 0},
  //     orderDate: new Date(),
  //     isAccepted:false,
  //     acceptDate: new Date(),
  //     isCompleted: false,
  //     completeDate: new Date(),
  //     isDeclined: false,
  //     declineDate: new Date(),
  //     declineReason: "",
  //     isCorrected: false,
  //     correctionDate: new Date(),
  //     correctionReason:"",
  //     description:"",
  //   });

    
  // //   this.form = fb.group({
  // //   id: [this.orderService.$orderSignal()?.id, []],
  // //   items: [this.cartService.$cart().items.filter(p=>p.checked),[Validators.required]],
  // //   delivery: [this.orderService.$orderSignal()?.delivery, [Validators.required]],
  // // });

  // }

    //this.orderService.$order;

    this.goBack = this.goBack.bind(this);
  }
  ngOnInit(): void {
    this.telegramService.BackButton.show();
    this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
  }
  ngOnDestroy(): void {
    this.telegramService.BackButton.hide();
    this.telegramService.BackButton.offClick(this.goBack);
  }

  goBack() {
    //this.location.back();
    this.navigation.back();
  }

  

  submit() {
    this.disableButton = true;

    // setTimeout(() => {
    //   this.onHandleUpdate();
    //   console.log(this.form.value);
    // }, 1000);
  }

  onHandleUpdate() {
    this.disableButton = false;
  }

  openForEdit(userId: string) {
    this.router.navigate(['/admin/user/edit/' + userId]);
  }

  // onDeleteItem(id: string, itemName:string) {
  //   const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(ConfirmDialogDemoComponent, {
  //     data: {
  //       message: "Вы действительно хотите удалить пользователя?",
  //       description: "Следующий пользователь: ["+itemName+"] будет удален. Подтвердите действие."
  //     }
  //   });
  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result == true)
  //     {
  //       // this.service.deleteUser(id).then(res => {
  //       //   this.refreshList();
  //       //   this.toastr.warning("Пользователь удален", "CheckIn7 - Запись онлайн");          
  //       // });
        
  //     }      
  //   });
  // }

  
}
