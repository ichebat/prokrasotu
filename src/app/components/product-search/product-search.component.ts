import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { IProduct, ProductsService } from '../../services/products.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ICartItem } from '../../services/cart.service';

export interface DialogData {  
  message: string;
  description: string;
  cartItem: ICartItem;
}

@Component({
  selector: 'app-product-search',
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductSearchComponent implements OnInit, OnDestroy {
  FilteredProducts: IProduct[] = []; //для работы с поиском
  form: FormGroup = new FormGroup({});

  public $searchFilter = signal<string>('');

  /**
   *
   */
  constructor(
    public productsService: ProductsService,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductSearchComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = fb.group({
      product: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    });
  }

  setInitialValue() {
    if (this.data.cartItem.product) this.form.controls['product'].setValue(this.data.cartItem.product);
    else
    this.form.controls['product'].setValue(null);
    this.form.controls['quantity'].setValue(this.data.cartItem.quantity);
  }

  public displayFn(product?: IProduct): string {
    return product
      ? (product.artikul ? 'арт.' + product.artikul + ': ' : '') + product.name
      : '';
  }

  compareFunction(o1: any, o2: any) {
    if (o1 == null || o2 == null) return false;
    return o1.id.toString() == o2.id.toString();
  }

  onSearchClear() {
    this.updateFilter('');
    this.resetForm();
    
  }

  onProductClear() {
    this.form.controls['product'].setValue(null);
    this.onSearchClear();
  }

  onQuantityClear() {
    this.form.controls['quantity'].setValue('');
  }


  ngOnDestroy(): void {
    this.onSearchClear();
  }

  ngOnInit(): void {
    this.setInitialValue();
  }

  resetForm() {
    this.form.reset();
  }

  updateFilter(filter: string) {
    this.productsService.updateFilter(filter);
    this.FilteredProducts = this.productsService.$products();
  }

  openDialog(flag: boolean){
    if (flag && this.form.valid)
    {
      this.data.cartItem.product = this.form.controls['product'].value as IProduct;
      this.data.cartItem.quantity = parseInt(this.form.controls['quantity'].value);
      this.data.cartItem.checked = true;
    }
    this.dialogRef.close(
    {
      flag: flag, 
      cartItem: this.data.cartItem
    });
  }
}
