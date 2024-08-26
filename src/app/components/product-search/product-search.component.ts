import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { IProduct, ProductsService } from '../../services/products.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogData } from '../confirm-dialog-demo/confirm-dialog-demo.component';



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
    });
  }

  setInitialValue() {
    this.form.controls['product'].setValue(null);
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
    this.form.controls['product'].setValue('');
    this.onSearchClear();
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
}
