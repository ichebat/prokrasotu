import { Component, Input } from '@angular/core';
import { IProduct } from '../../services/products.service';
import { CartService, ICartItem } from '../../services/cart.service';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-product-icon',
  templateUrl: './product-icon.component.html',
  styleUrl: './product-icon.component.scss',
})
export class ProductIconComponent {
  @Input() product!: IProduct;


  constructor(private cartService: CartService,
    public dialog: MatDialog,) {    
    
  }

  isInCart(product:IProduct)
  {
    return this.cartService.$cart().items.findIndex(p=>p.product.id === product.id)>=0;
  }

  quantityInCart(product:IProduct)
  {
    return this.cartService.$cart().items.find(p=>p.product.id === product.id)!.quantity;
  }

  addItem() {
    console.log('Add to cart');
    
    const newItem: ICartItem = {
      product: this.product,
      quantity: 1,
      checked: true,
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
      product: this.product,
      quantity: 1,
      checked: true,
    };

    this.cartService.removeItem(newItem);
    
  }

}
