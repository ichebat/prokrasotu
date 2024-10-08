import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CartService, ICartItem } from '../../services/cart.service';
import { TelegramService } from '../../services/telegram.service';
import { Location } from '@angular/common';
import { IProduct } from '../../services/products.service';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart-item',
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss'
})
export class CartItemComponent implements OnInit, OnDestroy {


  @Input() cartItem!: ICartItem;

  constructor(private location: Location,
    private cartService: CartService,
    private telegramService: TelegramService,
    public dialog: MatDialog,) {
      this.goBack = this.goBack.bind(this);
  }

  goBack() {
    this.location.back();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  sendData() {
  }

  quantityInCart(product:IProduct)
  {
    return this.cartService.$cart().items.find(p=>p.product.id === product.id && p.attribute?.description == this.cartItem.attribute?.description)!.quantity;
  }

  addItem() {
    
    console.log('Add to cart');
    
    const newItem: ICartItem = {
      product: this.cartItem.product,
      attribute: this.cartItem.attribute,
      quantity: 1,
      checked: this.cartItem.checked,
    };
    if(this.cartService.checkMaxCartItemPosition(newItem))
    {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: "Достигнуто ограничение",
            description:
              'Нельзя добавить более '+environment.maxCartItemPosition.toString()+' шт. одного товара в корзину.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
          
        } else return;
      });
    }
    if(this.cartService.checkMaxCartItems(newItem))
    {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: "Достигнуто ограничение",
            description:
              'Нельзя добавить более '+environment.maxCartItems.toString()+' разных товаров в корзину.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
          
        } else return;
      });
    }
    else
    this.cartService.addItem(newItem);
    
    
  }

  removeItem() {
    console.log('Remove from cart');
    
    const newItem: ICartItem = {
      product: this.cartItem.product,
      attribute: this.cartItem.attribute,
      quantity: 1,
      checked: this.cartItem.checked,
    };

    this.cartService.removeItem(newItem);
    
  }

  checkedChange(){
    this.cartItem.checked = !this.cartItem.checked;
  }


}
