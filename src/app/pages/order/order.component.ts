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
    //обновляем только если не загружен список и id >0 (редактирование заказа)
    if (parseInt(id)>0 && (!this.orderService.$orders() || this.orderService.$orders().length == 0)) this.orderService.updateOrdersApi();
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
