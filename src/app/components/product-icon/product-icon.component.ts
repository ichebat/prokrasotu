import {
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  IProduct,
  ProductAttributeClass,
  ProductClass,
} from '../../services/products.service';
import {
  CartItemClass,
  CartService,
  ICartItem,
} from '../../services/cart.service';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ReplaySubject, Subject, Subscription, takeUntil } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-product-icon',
  templateUrl: './product-icon.component.html',
  styleUrl: './product-icon.component.scss',
})
export class ProductIconComponent implements OnInit, OnDestroy {
  @Input() product!: ProductClass;

  dataFilterCtrl: FormControl = new FormControl();
  filteredData: ReplaySubject<ProductAttributeClass[]> = new ReplaySubject<
    ProductAttributeClass[]
  >(1);
  @ViewChild('singleSelect', { static: true }) singleSelect: MatSelect =
    {} as MatSelect;
  _onDestroy = new Subject<void>();

  selectedProductAttribute: ProductAttributeClass | null = null;
  formSelectedAttribute: FormGroup = new FormGroup({}); //реактивная форма для выбора атрибута

  private subscr_selectedProductAttribute: Subscription = Subscription.EMPTY;

  constructor(
    private cartService: CartService,
    public telegramService: TelegramService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private zone: NgZone,
  ) {
    this.formSelectedAttribute = fb.group({
      selectedProductAttribute: [
        this.selectedProductAttribute,
        this.product?.detail.attributes.length > 0 ? [Validators.required] : [],
      ],
    });
  }
  ngOnDestroy(): void {
    this.subscr_selectedProductAttribute.unsubscribe();
    this._onDestroy.next();
    this._onDestroy.complete();
  }
  ngOnInit(): void {

    this.filteredData.next(this.product.detail.attributes.slice());
    this.dataFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterData();
      });

    this.setInitialValue();

    this.subscr_selectedProductAttribute = this.formSelectedAttribute
        .get('selectedProductAttribute')!
        .valueChanges.subscribe((val) => {
          this.selectedProductAttribute = val;
        });      
  }

  filterData() {
    if (!this.product.detail.attributes || this.product.detail.attributes.length==0) {
      return;
    }
    let search = this.dataFilterCtrl.value;
    if (!search) {
      this.filteredData.next(this.product.detail.attributes.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    this.filteredData.next(
      this.product.detail.attributes.filter(
        (x: any) => x.keyValues.join(' ').toLowerCase().indexOf(search) > -1
      )
    );
  }

  //после конструктора необходимо заполнить форму начальными значениями
  setInitialValue() {
    this.formSelectedAttribute.controls['selectedProductAttribute'].setValue(
      this.selectedProductAttribute,
    );

    this.filteredData.next(this.product.detail.attributes.slice());
  }

  isInCart(product: IProduct) {
    return (
      this.cartService
        .$cart()
        .items.findIndex(
          (p) =>
            p.product.id === product.id &&
            p.attribute?.keyValues.join(' ') ==
              this.selectedProductAttribute?.keyValues.join(' '),
        ) >= 0
    );
  }

  quantityInCart(product: IProduct) {
    //return this.cartService.$cart().items.find(p=>p.product.id === product.id)!.quantity;
    const searchItem = this.cartService
      .$cart()
      .items.find(
        (p) =>
          p.product.id === product.id &&
          p.attribute?.keyValues.join(' ') ==
            this.selectedProductAttribute?.keyValues.join(' '),
      );
    return searchItem ? searchItem.quantity : 0;
  }

  addItem() {
    if (this.product.id <= 0) return;
    console.log('Add to cart');

    const newItem: CartItemClass = {
      product: this.product,
      attribute: this.selectedProductAttribute,
      quantity: 1,
      checked: true,
    };

    if (
      this.product.detail.attributes.length > 0 &&
      !this.selectedProductAttribute
    ) {
      this.zone.run(() => {
        const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
          ConfirmDialogDemoComponent,
          {
            data: {
              message: 'Сначала выберите товар',
              description: 'Выберите товар из списка, чтобы добавить в корзину',
              showCancelButton: false,
            },
          },
        );
        dialogRef.afterClosed().subscribe((result) => {
          return;
        });
      });
    }

    if (this.cartService.checkMaxCartItemPosition(newItem)) {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: 'Достигнуто ограничение',
            description:
              'Нельзя добавить более ' +
              environment.maxCartItemPosition.toString() +
              ' шт. одного товара в корзину.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
        } else return;
      });
    }
    if (this.cartService.checkMaxCartItems(newItem)) {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: 'Достигнуто ограничение',
            description:
              'Нельзя добавить более ' +
              environment.maxCartItems.toString() +
              ' разных товаров в корзину.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
        } else return;
      });
    } else if (
      (this.product.detail.attributes.length > 0 &&
        this.selectedProductAttribute) ||
      this.product.detail.attributes.length == 0
    )
      this.cartService.addItem(newItem);
  }

  removeItem() {
    console.log('Remove from cart');

    const newItem: ICartItem = {
      product: this.product,
      attribute: this.selectedProductAttribute,
      quantity: 1,
      checked: true,
    };

    this.cartService.removeItem(newItem);
  }

  selectedProductAttributeChange(item: ProductAttributeClass | null) {
    this.selectedProductAttribute = item;
  }

  //для корректного отображения select контрола необходима функция сравнения
  compareFunction(o1: any, o2: any) {
    if (o1 == null || o2 == null) return false;
    return o1.keyValues.join(' ').toLowerCase().toString() == o2.keyValues.join(' ').toLowerCase().toString();
  }

  minPrice(){
    let result = this.product.price;
    this.product.detail.attributes.forEach(p=>{
      if((p.price>0 && p.price<result) || result == 0) result = p.price;
    });
    return result;
  }

  maxPrice(){
    let result = this.product.price;
    this.product.detail.attributes.forEach(p=>{
      if((p.price>0 && p.price>result) || result == 0) result = p.price;
    });
    return result;
  }
}
