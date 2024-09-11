import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { IProduct, ProductsService } from '../../services/products.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
  // form1: FormGroup = new FormGroup({});
  // form2: FormGroup = new FormGroup({});

  public $searchFilter = signal<string>('');

  isLinear = false;

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
      product: [null, [Validators.required, this.productValidator]],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    });
    // this.form1 = fb.group({
    //   product: [null, [Validators.required]],
    // });
    // this.form2 = fb.group({
    //   quantity: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    // });
  }
  // валидатор выбранного продукта
  productValidator(control: FormControl): { [s: string]: boolean } | null {

    
    if (control.value && typeof(control.value)== 'string')  {
      //console.log("true"+control.value);
      return { product: true };
    }
    //console.log("false"+control.value);
    return null;
  }

  setInitialValue() {
    if (this.data.cartItem.product) this.form.controls['product'].setValue(this.data.cartItem.product);
    else
    this.form.controls['product'].setValue(null);
    this.form.controls['quantity'].setValue(this.data.cartItem.quantity);
    // if (this.data.cartItem.product) this.form1.controls['product'].setValue(this.data.cartItem.product);
    // else
    // this.form1.controls['product'].setValue(null);
    // this.form2.controls['quantity'].setValue(this.data.cartItem.quantity);
  }

  public displayFn(product?: IProduct): string  {
    return product
      ? (product.artikul ? 'арт.' + product.artikul + ': ' : '') + 
      product.name
      : "";
  }

  // displayFn(FilteredProducts: IProduct[]): (val: IProduct) => string {
  //   return (val: IProduct) => { 
  //     const correspondingOption = Array.isArray(FilteredProducts) ? FilteredProducts.find(product => product.id === val.id) : null;
  //     return correspondingOption ? (correspondingOption.artikul ? 'арт.' + correspondingOption.artikul + ': ' : '') + correspondingOption.name : '';
  //   }
  // }

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
    // this.form1.controls['product'].setValue(null);
    this.onSearchClear();
  }

  onQuantityClear() {
    this.form.controls['quantity'].setValue('');
    // this.form2.controls['quantity'].setValue('');
  }


  ngOnDestroy(): void {
    this.onSearchClear();
  }

  ngOnInit(): void {
    this.setInitialValue();
  }

  resetForm() {
    this.form.reset();
    // this.form1.reset();
    // this.form2.reset();
  }

  updateFilter(filter: string) {
    this.productsService.updateFilter(filter);
    this.FilteredProducts = this.productsService.$products();
  }

  openDialog(flag: boolean){
    if (flag && this.form.valid)
    // if (flag && this.form1.valid && this.form2.valid)
    {
      this.data.cartItem.product = this.form.controls['product'].value as IProduct;
      this.data.cartItem.quantity = parseInt(this.form.controls['quantity'].value);
      // this.data.cartItem.product = this.form1.controls['product'].value as IProduct;
      // this.data.cartItem.quantity = parseInt(this.form2.controls['quantity'].value);
      this.data.cartItem.checked = true;
    }
    this.dialogRef.close(
    {
      flag: flag, 
      cartItem: this.data.cartItem
    });
  }
}
