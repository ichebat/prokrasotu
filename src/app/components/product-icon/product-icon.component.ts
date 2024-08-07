import { Component, Input } from '@angular/core';
import { IProduct } from '../../services/products.service';
import { CartService, ICartItem } from '../../services/cart.service';


@Component({
  selector: 'app-product-icon',
  templateUrl: './product-icon.component.html',
  styleUrl: './product-icon.component.scss',
})
export class ProductIconComponent {
  @Input() product!: IProduct;


  constructor(private cartService: CartService,) {    
    
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
