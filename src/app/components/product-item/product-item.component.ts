import {
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  signal,
} from '@angular/core';
import {
  IProduct,
  IProductDetail,
  ProductAttributeClass,
  ProductClass,
  ProductDetailClass,
  ProductsService,
} from '../../services/products.service';
import {
  CartItemClass,
  CartService,
  ICartItem,
} from '../../services/cart.service';
import { TelegramService } from '../../services/telegram.service';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NavigationService } from '../../services/navigation.service';
import {
  ReplaySubject,
  Subject,
  Subscription,
  distinctUntilChanged,
  takeUntil,
} from 'rxjs';
import { ProductDetailComponent } from '../product-detail/product-detail.component';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.scss',
})
export class ProductItemComponent implements OnInit, OnDestroy {
  @Input() product!: ProductClass;
  @Input() action: string = ''; //действие по которому строится контрол (view, edit)

  dataFilterCtrl: FormControl = new FormControl();
  filteredData: ReplaySubject<ProductAttributeClass[]> = new ReplaySubject<
    ProductAttributeClass[]
  >(1);
  @ViewChild('singleSelect', { static: true }) singleSelect: MatSelect =
    {} as MatSelect;
  _onDestroy = new Subject<void>();

  owner = environment.owner;

  selectedProductAttribute: ProductAttributeClass | null = null;

  categoryOptionsAuto; //для работы c autocomplete категории
  typeOptionsAuto; //для работы c autocomplete типа
  brandOptionsAuto; //для работы c autocomplete бренда
  brandLineOptionsAuto; //для работы c autocomplete линейка бренда
  brandSeriesOptionsAuto; //для работы c autocomplete серия бренда

  form: FormGroup = new FormGroup({}); //реактивная форма
  formSelectedAttribute: FormGroup = new FormGroup({}); //реактивная форма для выбора продукта из карточки

  private subscr_form: Subscription = Subscription.EMPTY;
  private subscr_form_detail: Subscription = Subscription.EMPTY;
  private subscr_id: Subscription = Subscription.EMPTY;
  private subscr_url: Subscription = Subscription.EMPTY;
  private subscr_artikul: Subscription = Subscription.EMPTY;
  private subscr_category: Subscription = Subscription.EMPTY;
  private subscr_type: Subscription = Subscription.EMPTY;
  private subscr_brand: Subscription = Subscription.EMPTY;
  private subscr_brandLine: Subscription = Subscription.EMPTY;
  private subscr_brandSeries: Subscription = Subscription.EMPTY;
  private subscr_name: Subscription = Subscription.EMPTY;
  private subscr_description: Subscription = Subscription.EMPTY;
  private subscr_dopolnitelno: Subscription = Subscription.EMPTY;
  private subscr_imageUrl: Subscription = Subscription.EMPTY;
  private subscr_price: Subscription = Subscription.EMPTY;
  private subscr_discount: Subscription = Subscription.EMPTY;
  private subscr_isNew: Subscription = Subscription.EMPTY;
  private subscr_translit: Subscription = Subscription.EMPTY;
  private subscr_isActive: Subscription = Subscription.EMPTY;
  private subscr_selectedProductAttribute: Subscription = Subscription.EMPTY;

  private $isInCartSignal = signal<boolean>(false);
  private $quantitySignal = signal<number>(0);

  $isInCart = computed(() => {
    const isInCartSignalValue = this.$isInCartSignal();
    const quantitySignalValue = this.$quantitySignal();
    const cartItemsValue = this.cartService.$cart().items;

    if (cartItemsValue == undefined) {
      return false;
    } else {
      return (
        cartItemsValue.findIndex((p) => p.product.id === this.product.id) >= 0
      );
    }
  });

  $quantity = computed(() => {
    const quantitySignalValue = this.$quantitySignal();
    const isInCartSignalValue = this.$isInCartSignal();
    const cartItemsValue = this.cartService.$cart().items;
    if (cartItemsValue == undefined) {
      return 0;
    } else {
      return cartItemsValue.find((p) => p.product.id === this.product.id)
        ?.quantity;
    }
  });

  isMainButtonHidden = true; //иногда, когда открывается диалог, необходимо скрыть MainButton телеграма, чтобы он не закрывал экран, а после диалога вернуть как было
  MainButtonText = ''; //в зависимости от того какой режим разные надписи на главной кнопке телеграма

  mainButtonTextValid = 'Отправить в ' + this.owner.marketName;
  mainButtonTextProgress = 'Отправка...';
  mainButtonTextInvalid = 'Некорректно заполнены поля';

  //здесь храним видимость и доступность к редактированию контролов реактивной формы
  FormControlsFlags: any = [
    { controlName: 'id', visible: true, enabled: true },
    { controlName: 'url', visible: true, enabled: true },
    { controlName: 'artikul', visible: true, enabled: true },
    { controlName: 'category', visible: true, enabled: true },
    { controlName: 'type', visible: true, enabled: true },
    { controlName: 'brand', visible: true, enabled: true },
    { controlName: 'brandLine', visible: true, enabled: true },
    { controlName: 'brandSeries', visible: true, enabled: true },
    { controlName: 'name', visible: true, enabled: true },
    { controlName: 'description', visible: true, enabled: true },
    { controlName: 'dopolnitelno', visible: true, enabled: true },
    { controlName: 'imageUrl', visible: true, enabled: true },
    { controlName: 'price', visible: true, enabled: true },
    { controlName: 'discount', visible: true, enabled: true },
    { controlName: 'isNew', visible: true, enabled: true },
    { controlName: 'isActive', visible: true, enabled: true },
    { controlName: 'translit', visible: true, enabled: true },

    { controlName: 'button_submit', visible: true, enabled: true },
    { controlName: 'selectedProductAttribute', visible: true, enabled: true },
  ];

  //когда нажимаем отправку кнопки становятся неактивными
  disableButton: boolean = false; //отключает кнопки на время отправки данных

  constructor(
    private cartService: CartService,
    private productService: ProductsService,
    public telegramService: TelegramService,
    public dialog: MatDialog,
    private router: Router,
    private navigation: NavigationService,
    private fb: FormBuilder,
    private zone: NgZone,
  ) {
    this.goBack = this.goBack.bind(this); //функция по кнопке "назад" телеграм

    this.categoryOptionsAuto = this.productService.$productCategories(); //this.productService.$productCategoriesMenuTree();
    this.typeOptionsAuto = this.productService.$productTypes(); //this.productService.$productTypesMenuTree();
    this.brandOptionsAuto = this.productService.$productBrands();
    this.brandLineOptionsAuto = this.productService.$productBrandLines();
    this.brandSeriesOptionsAuto = this.productService.$productBrandSeriesList();

    // //подписываемся на изменения формы, для скрытия/отображения MainButton
    // this.subscr_form = this.form.statusChanges
    //   .pipe(distinctUntilChanged())
    //   .subscribe(() => {
    //     console.log(this.form.status);
    //     this.isFormValid();
    //   });

    this.sendData = this.sendData.bind(this); //функция для главной MainButton кнопки телеграм

    // //ниже привязка действия к MainButton телеграм
    // const sendDataToTelegram = () => {
    //   if (
    //     this.getVisible('button_submit') &&
    //     this.getEnabled('button_submit')
    //   ) {
    //     this.sendData();
    //   }
    // };

    // //привязка идет эффектом
    // effect(() => {
    //   this.telegramService.tg.onEvent('mainButtonClicked', sendDataToTelegram);
    //   return () => {
    //     this.telegramService.tg.offEvent(
    //       'mainButtonClicked',
    //       sendDataToTelegram,
    //     );
    //   };
    // });

    //строим реактивную форму с валидацией
    this.form = fb.group({
      id: [this.product?.id, [Validators.required]],
      url: [
        this.product?.url,
        [
          Validators.minLength(2),
          Validators.maxLength(255),
          Validators.pattern(
            '^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$',
          ),
        ],
      ],
      artikul: [
        this.product?.artikul,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      category: [
        this.product?.category,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      type: [
        this.product?.type,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      brand: [
        this.product?.brand,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      brandLine: [
        this.product?.brandLine,
        [Validators.minLength(2), Validators.maxLength(50)],
      ],
      brandSeries: [
        this.product?.brandSeries,
        [Validators.minLength(2), Validators.maxLength(50)],
      ],
      name: [
        this.product?.name,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
          Validators.pattern('[A-Za-zА-Яа-я0-9-:()!/,_% ]{2,100}'),
        ],
      ],
      description: [
        this.product?.description,
        [Validators.required, Validators.maxLength(5000)],
      ],
      dopolnitelno: [this.product?.dopolnitelno, [Validators.maxLength(5000)]],
      imageUrl: [
        this.product?.imageUrl,
        [
          Validators.minLength(2),
          Validators.maxLength(255),
          Validators.pattern(
            '^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$',
          ),
        ],
      ],
      price: [this.product?.price, [Validators.required, Validators.min(0)]],
      discount: [
        this.product?.discount,
        [Validators.required, Validators.min(0), Validators.max(99)],
      ],
      isNew: [this.product?.isNew, []],
      translit: [this.product?.translit, []],
      detail: [this.product?.detail, []],
      isActive: [this.product?.isActive, []],
    });

    this.formSelectedAttribute = fb.group({
      selectedProductAttribute: [
        this.selectedProductAttribute,
        this.product?.detail.attributes.length > 0 ? [Validators.required] : [],
      ],
    });

    
  }

  //после конструктора необходимо заполнить форму начальными значениями
  setInitialValue() {
    this.formSelectedAttribute.controls['selectedProductAttribute'].setValue(
      this.selectedProductAttribute,
    );

    this.filteredData.next(this.product.detail.attributes.slice());

    //console.log(this.telegramService.IsTelegramWebAppOpened);

    //выставляем флаги отображения контролов
    this.FormControlsFlags.forEach((item) => {
      //1. ******************************************* */
      //если создается новый продукт не через телеграм бота (через сайт)
      if (
        !this.telegramService.IsTelegramWebAppOpened &&
        this.product?.id == 0
      ) {
        //отображение следующих контролов будет изменено
        item.visible = false;

        //возможность редактирования следующих контролов будет изменена
        item.enabled = false;

        if (item.controlName == 'selectedProductAttribute') {
          item.visible = true && this.product.detail.attributes.length > 0;
          item.enabled = true && this.product.detail.attributes.length > 0;
        }
      }

      //2. ******************************************* */
      //если создается новый продукт ЧЕРЕЗ телеграм бота (НЕ через сайт)
      else if (
        this.telegramService.IsTelegramWebAppOpened &&
        this.telegramService.isAdmin &&
        this.product?.id == 0
      ) {
        //отображение следующих контролов будет изменено
        item.visible = true;

        //возможность редактирования следующих контролов будет изменена
        item.enabled = true;

        if (item.controlName == 'selectedProductAttribute') {
          item.visible = true && this.product.detail.attributes.length > 0;
          item.enabled = true && this.product.detail.attributes.length > 0;
        }
      }

      //3. ******************************************* */
      //если продукт редактируется ЧЕРЕЗ телеграм бота (НЕ через сайт)
      else if (
        this.telegramService.IsTelegramWebAppOpened &&
        this.telegramService.isAdmin &&
        this.product?.id > 0
      ) {
        //отображение следующих контролов будет изменено
        item.visible = true;

        //возможность редактирования следующих контролов будет изменена
        item.enabled = true;

        if (item.controlName == 'selectedProductAttribute') {
          item.visible = true && this.product.detail.attributes.length > 0;
          item.enabled = true && this.product.detail.attributes.length > 0;
        }
      }

      //4. ******************************************* */
      //если продукт редактируется не через телеграм бота (через сайт)
      else if (
        !this.telegramService.IsTelegramWebAppOpened &&
        this.product?.id > 0
      ) {
        //такое запрещено, все скрываем и не редактируем
        item.visible = false;
        item.enabled = false;

        if (item.controlName == 'selectedProductAttribute') {
          item.visible = true && this.product.detail.attributes.length > 0;
          item.enabled = true && this.product.detail.attributes.length > 0;
        }
      }
      //КОНЕЦ. ******************************************* */

      //выключаем контролы
      if (!item.controlName.toString().startsWith('button_')) {
        if (!item.enabled && this.form.controls[item.controlName])
          this.form.controls[item.controlName].disable();
        if (
          !item.enabled &&
          this.formSelectedAttribute.controls[item.controlName]
        )
          this.formSelectedAttribute.controls[item.controlName].disable();
      }
    });

    if (!this.telegramService.isAdmin) return;

    this.form.controls['id'].setValue(this.product?.id);
    this.form.controls['url'].setValue(this.product?.url);
    this.form.controls['artikul'].setValue(this.product?.artikul), //{value: this.product?.delivery, disabled: (this.product?.isAccepted || this.product?.isCompleted || this.product?.isCancelled)});
      this.form.controls['category'].setValue(this.product?.category);
    this.form.controls['type'].setValue(this.product?.type);
    this.form.controls['brand'].setValue(this.product?.brand);
    this.form.controls['brandLine'].setValue(this.product?.brandLine);
    this.form.controls['brandSeries'].setValue(this.product?.brandSeries);
    this.form.controls['name'].setValue(this.product?.name);
    this.form.controls['description'].setValue(this.product?.description);
    this.form.controls['dopolnitelno'].setValue(this.product?.dopolnitelno);
    this.form.controls['imageUrl'].setValue(this.product?.imageUrl);
    this.form.controls['price'].setValue(this.product?.price);
    this.form.controls['discount'].setValue(this.product?.discount);
    this.form.controls['isNew'].setValue(this.product?.isNew);
    this.form.controls['translit'].setValue(this.product?.translit);
    this.form.controls['detail'].setValue(this.product?.detail);
    this.form.controls['isActive'].setValue(this.product?.isActive);
  }

  ngOnInit(): void {
    this.filteredData.next(this.product.detail.attributes.slice());
    this.dataFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterData();
      });

    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.show();
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
      if (this.telegramService.isAdmin) {
        this.telegramService.MainButton.show();
        this.telegramService.MainButton.enable();
        this.telegramService.MainButton.onClick(this.sendData);
        this.telegramService.MainButton.setText(this.mainButtonTextValid);
      } else this.telegramService.MainButton.hide();
    }

    this.setInitialValue();

    this.subscr_selectedProductAttribute = this.formSelectedAttribute
      .get('selectedProductAttribute')!
      .valueChanges.subscribe((val) => {
        this.selectedProductAttribute = val;
      });

    if (!this.telegramService.isAdmin) return;

    // //подписываемся на изменения формы, для скрытия/отображения MainButton
    // this.subscr_form = this.form.statusChanges
    //   .pipe(distinctUntilChanged())
    //   .subscribe(() => {
    //     console.log(this.form.status);
    //     this.isFormValid();
    //   });

    this.subscr_id = this.form.get('id')!.valueChanges.subscribe((val) => {
      this.product.id = val;
    });
    this.subscr_url = this.form.get('url')!.valueChanges.subscribe((val) => {
      this.product.url = val;
    });
    this.subscr_artikul = this.form
      .get('artikul')!
      .valueChanges.subscribe((val) => {
        this.product.artikul = val;
      });

    //Чтобы работал Autocomplete подписку не включаем
    // this.subscr_category = this.form
    //   .get('category')!
    //   .valueChanges.subscribe((val) => {
    //     this.product.category = val;
    //   });
    // this.subscr_type = this.form.get('type')!.valueChanges.subscribe((val) => {
    //   this.product.type = val;
    // });
    // this.subscr_brand = this.form
    //   .get('brand')!
    //   .valueChanges.subscribe((val) => {
    //     this.product.brand = val;
    //   });
    // this.subscr_brandLine = this.form
    //   .get('brandLine')!
    //   .valueChanges.subscribe((val) => {
    //     this.product.brandLine = val;
    //   });
    // this.subscr_brandSeries = this.form
    //   .get('brandSeries')!
    //   .valueChanges.subscribe((val) => {
    //     this.product.brandSeries = val;
    //   });
    this.subscr_name = this.form.get('name')!.valueChanges.subscribe((val) => {
      this.product.name = val;
    });
    this.subscr_description = this.form
      .get('description')!
      .valueChanges.subscribe((val) => {
        this.product.description = val;
      });
    this.subscr_dopolnitelno = this.form
      .get('dopolnitelno')!
      .valueChanges.subscribe((val) => {
        this.product.dopolnitelno = val;
      });
    this.subscr_imageUrl = this.form
      .get('imageUrl')!
      .valueChanges.subscribe((val) => {
        this.product.imageUrl = val;
      });
    this.subscr_price = this.form
      .get('price')!
      .valueChanges.subscribe((val) => {
        this.product.price = val;
      });
    this.subscr_discount = this.form
      .get('discount')!
      .valueChanges.subscribe((val) => {
        this.product.discount = val;
      });
    this.subscr_isNew = this.form
      .get('isNew')!
      .valueChanges.subscribe((val) => {
        this.product.isNew = val;
      });
    this.subscr_isActive = this.form
      .get('isActive')!
      .valueChanges.subscribe((val) => {
        this.product.isActive = val;
      });

    this.subscr_translit = this.form
      .get('translit')!
      .valueChanges.subscribe((val) => {
        this.product.translit = val;
      });

    this.form.updateValueAndValidity(); //обновляем статус формы

    this.onHandleUpdate();
  }

  filterData() {
    if (
      !this.product.detail.attributes ||
      this.product.detail.attributes.length == 0
    ) {
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
        (x: any) => x.keyValues.join(' ').toLowerCase().indexOf(search) > -1,
      ),
    );
  }

  //отвязываем кнопки
  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.hide();
      this.telegramService.BackButton.offClick(this.goBack);

      if (this.telegramService.isAdmin) {
        this.telegramService.MainButton.hide();
        this.telegramService.MainButton.offClick(this.sendData);
        this.isMainButtonHidden = true;
      }
    }

    this.subscr_form.unsubscribe();
    this.subscr_id.unsubscribe();
    this.subscr_url.unsubscribe();
    this.subscr_artikul.unsubscribe();
    this.subscr_category.unsubscribe();
    this.subscr_type.unsubscribe();
    this.subscr_brand.unsubscribe();
    this.subscr_brandLine.unsubscribe();
    this.subscr_brandSeries.unsubscribe();
    this.subscr_name.unsubscribe();
    this.subscr_description.unsubscribe();
    this.subscr_dopolnitelno.unsubscribe();
    this.subscr_imageUrl.unsubscribe();
    this.subscr_price.unsubscribe();
    this.subscr_discount.unsubscribe();
    this.subscr_isNew.unsubscribe();
    this.subscr_isActive.unsubscribe();
    this.subscr_selectedProductAttribute.unsubscribe();
    this.subscr_translit.unsubscribe();
  }

  // //проверка валидности и скрытие/отображение главной кнопки
  // private isFormValid() {
  //   if (this.form.valid) {
  //     // this.telegramService.MainButton.show();
  //     // this.isMainButtonHidden = false;
  //     this.telegramService.MainButton.enable();
  //     this.telegramService.MainButton.setText(this.mainButtonTextValid);
  //   } else {
  //     // this.telegramService.MainButton.hide();
  //     // this.isMainButtonHidden = true;
  //     this.telegramService.MainButton.disable();
  //     this.telegramService.MainButton.setText(this.mainButtonTextInvalid);
  //   }
  // }

  isInCart(product: ProductClass) {
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

  quantityInCart(product: ProductClass) {
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
      this.zone.run(() => {
        const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
          ConfirmDialogDemoComponent,
          {
            data: {
              message: 'Достигнуто ограничение',
              description:
                'Нельзя добавить более ' +
                environment.maxCartItemPosition.toString() +
                ' шт. одного товара в корзину.',
              showCancelButton: false,
            },
          },
        );
        dialogRef.afterClosed().subscribe((result) => {
          return;
        });
      });
    }
    if (this.cartService.checkMaxCartItems(newItem)) {
      this.zone.run(() => {
        const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
          ConfirmDialogDemoComponent,
          {
            data: {
              message: 'Достигнуто ограничение',
              description:
                'Нельзя добавить более ' +
                environment.maxCartItems.toString() +
                ' разных товаров в корзину.',
              showCancelButton: false,
            },
          },
        );
        dialogRef.afterClosed().subscribe((result) => {
          return;
        });
      });
    } else if (
      (this.product.detail.attributes.length > 0 &&
        this.selectedProductAttribute) ||
      this.product.detail.attributes.length == 0
    )
      this.cartService.addItem(newItem);
  }

  removeItem() {
    if (this.product.id <= 0) return;
    console.log('Remove from cart');

    const newItem: ICartItem = {
      product: this.product,
      attribute: this.selectedProductAttribute,
      quantity: 1,
      checked: true,
    };

    this.cartService.removeItem(newItem);
  }

  getUrl() {
    const thisUrl = this.router.url;
    if (thisUrl.indexOf('#') >= 0) return thisUrl.split('#')[0];
    else return thisUrl;
  }

  //https://api.telegram.org/bot[TOKEN]/sendMessage?chat_id=[CHAT_ID]&text=[TEXT]&reply_markup={"inline_keyboard": [[{"text": "hi", "callback_data": "hi"}]]}
  //https://stackoverflow.com/questions/70997956/how-to-send-a-message-via-url-with-inline-buttons

  //функция отправки данных (id ==0 для нового продукта, id>0 для редактирования)
  sendData(method = 'update') {
    if (!this.telegramService.isAdmin) return;

    if (!this.form.valid && method == 'update') {
      this.telegramService.MainButton.setText(this.mainButtonTextInvalid);
      this.telegramService.MainButton.disable();
      setTimeout(() => {
        this.telegramService.MainButton.setText(this.mainButtonTextValid);
        this.telegramService.MainButton.enable();
        return;
      }, 5000);
      return;
    }

    //при загрузке картинки на гитхаб возникает отправка, которой надо дождаться
    if (this.disableButton && method == 'update') {
      this.telegramService.MainButton.setText(this.mainButtonTextProgress);
      this.telegramService.MainButton.disable();
      setTimeout(() => {
        this.telegramService.MainButton.setText(this.mainButtonTextValid);
        this.telegramService.MainButton.enable();
        return;
      }, 5000);
      return;
    }

    if (
      this.product.id > 0 &&
      this.telegramService.isAdmin &&
      method == 'remove'
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText(this.mainButtonTextProgress);
      this.telegramService.MainButton.disable();

      this.productService
        .sendProductToGoogleAppsScript(
          this.telegramService.Id,
          this.telegramService.UserName,
          'removeProduct',
          {
            id: this.product?.id,
            url: this.form.controls['url'].value,
            artikul: this.form.controls['artikul'].value,
            category: this.form.controls['category'].value,
            type: this.form.controls['type'].value,
            brand: this.form.controls['brand'].value,
            brandLine: this.form.controls['brandLine'].value,
            brandSeries: this.form.controls['brandSeries'].value,
            name: this.form.controls['name'].value,
            description: this.form.controls['description'].value,
            dopolnitelno: this.form.controls['dopolnitelno'].value,
            imageUrl: this.form.controls['imageUrl'].value,
            price: this.form.controls['price'].value,
            discount: this.form.controls['discount'].value,
            isNew: this.form.controls['isNew'].value,
            translit: this.form.controls['translit'].value,
            detail: this.form.controls['detail'].value,
            isActive: this.form.controls['isActive'].value,
          },
        )
        .subscribe({
          next: (data) => {
            const removeProduct_response = data;
            console.log('removeProduct data', data);
          },
          error: (err) => {
            this.onHandleUpdate();
            console.log('removeProduct error', err);
          },
          complete: () => {
            //обновляем корзину
            let flagCart = false;
            this.cartService.$cart.update((currentCart) => {
              const existingItem = currentCart.items.find(
                (i) => i.product.id === this.product.id,
              );
              if (!existingItem) {
                return currentCart;
              } else {
                existingItem.quantity = 0;
                flagCart = true;
              }

              currentCart.items = currentCart.items.filter(
                (p) => p.quantity > 0,
              );

              currentCart.totalCount = this.cartService.calculateTotalCount(
                currentCart.items,
              );
              currentCart.totalAmount = this.cartService.calculateTotalAmount(
                currentCart.items,
              );

              return currentCart;
            });

            //обновляем корзину в таблице
            if (flagCart && this.telegramService.Id) {
              this.cartService
                .sendCartToGoogleAppsScript(
                  this.telegramService.Id,
                  this.telegramService.UserName,
                  'removeCart',
                  this.cartService.$cart(),
                )
                .subscribe({
                  next: (data) => {
                    console.log('removeCart data', data);
                  },
                  error: (err) => {
                    this.onHandleUpdate();
                    console.log('removeCart error', err);
                  },
                  complete: () => {
                    console.log('removeCart complete');
                    //console.log(this.cartService.$cart());
                  },
                });
            }

            this.onHandleUpdate();
            console.log('removeProduct complete');
            this.router.navigate(['/']);
            this.productService.updateProductsApi();
          },
        });
    }

    //добавление нового товара делается кнопкой submit

    if (
      this.product.id == 0 &&
      this.getVisible('button_submit') &&
      this.getEnabled('button_submit') &&
      this.form.valid &&
      this.telegramService.isAdmin &&
      method == 'update'
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText(this.mainButtonTextProgress);
      this.telegramService.MainButton.disable();

      this.productService
        .sendProductToGoogleAppsScript(
          this.telegramService.Id,
          this.telegramService.UserName,
          'addProduct',
          {
            id: 0,
            url: this.form.controls['url'].value,
            artikul: this.form.controls['artikul'].value,
            category: this.form.controls['category'].value,
            type: this.form.controls['type'].value,
            brand: this.form.controls['brand'].value,
            brandLine: this.form.controls['brandLine'].value,
            brandSeries: this.form.controls['brandSeries'].value,
            name: this.form.controls['name'].value,
            description: this.form.controls['description'].value,
            dopolnitelno: this.form.controls['dopolnitelno'].value,
            imageUrl: this.form.controls['imageUrl'].value,
            price: this.form.controls['price'].value,
            discount: this.form.controls['discount'].value,
            isNew: this.form.controls['isNew'].value,
            translit: this.form.controls['translit'].value,
            detail: this.form.controls['detail'].value,
            isActive: this.form.controls['isActive'].value,
          },
        )
        .subscribe({
          next: (data) => {
            const addProduct_response = data;
            console.log('addProduct data', data);
          },
          error: (err) => {
            this.onHandleUpdate();
            console.log('addProduct error', err);
          },
          complete: () => {
            this.onHandleUpdate();
            console.log('addProduct complete');
            this.router.navigate(['/']);
            this.productService.updateProductsApi();
          },
        });
    }

    if (
      this.product.id > 0 &&
      this.getVisible('button_submit') &&
      this.getEnabled('button_submit') &&
      this.form.valid &&
      this.telegramService.isAdmin &&
      method == 'update'
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText(this.mainButtonTextProgress);
      this.telegramService.MainButton.disable();

      this.productService
        .sendProductToGoogleAppsScript(
          this.telegramService.Id,
          this.telegramService.UserName,
          'updateProduct',
          {
            id: this.product?.id,
            url: this.form.controls['url'].value,
            artikul: this.form.controls['artikul'].value,
            category: this.form.controls['category'].value,
            type: this.form.controls['type'].value,
            brand: this.form.controls['brand'].value,
            brandLine: this.form.controls['brandLine'].value,
            brandSeries: this.form.controls['brandSeries'].value,
            name: this.form.controls['name'].value,
            description: this.form.controls['description'].value,
            dopolnitelno: this.form.controls['dopolnitelno'].value,
            imageUrl: this.form.controls['imageUrl'].value,
            price: this.form.controls['price'].value,
            discount: this.form.controls['discount'].value,
            isNew: this.form.controls['isNew'].value,
            translit: this.form.controls['translit'].value,
            detail: this.form.controls['detail'].value,
            isActive: this.form.controls['isActive'].value,
          },
        )
        .subscribe({
          next: (data) => {
            const updateProduct_response = data;
            console.log('updateProduct data', data);
          },
          error: (err) => {
            this.onHandleUpdate();
            console.log('updateProduct error', err);
          },
          complete: () => {
            //обновляем корзину
            let flagCart = false;

            // this.cartService.$cart.update((currentCart) => {
            //   const existingItem = currentCart.items.find(
            //     (i) => i.product.id === item.product.id,
            //   );
            //   if (!existingItem) {
            //     return currentCart;
            //   } else {
            //     if (existingItem.quantity - item.quantity <= 0) {
            //       item.quantity = existingItem.quantity;
            //     }
            //     existingItem.quantity -= item.quantity;
            //     flagCart = true;
            //   }

            //   currentCart.items = currentCart.items.filter(
            //     (p) => p.quantity > 0,
            //   );

            //   currentCart.totalCount = this.cartService.calculateTotalCount(
            //     currentCart.items,
            //   );
            //   currentCart.totalAmount = this.cartService.calculateTotalAmount(
            //     currentCart.items,
            //   );

            //   return currentCart;
            // });

            //обновляем корзину в таблице
            if (flagCart && this.telegramService.Id) {
              this.cartService
                .sendCartToGoogleAppsScript(
                  this.telegramService.Id,
                  this.telegramService.UserName,
                  'removeCart',
                  this.cartService.$cart(),
                )
                .subscribe({
                  next: (data) => {
                    console.log('removeCart data', data);
                  },
                  error: (err) => {
                    this.onHandleUpdate();
                    console.log('removeCart error', err);
                  },
                  complete: () => {
                    console.log('removeCart complete');
                    //console.log(this.cartService.$cart());
                  },
                });
            }

            this.onHandleUpdate();
            console.log('updateProduct complete');
            this.router.navigate(['/']);
            this.productService.updateProductsApi();
          },
        });
    }
  }

  //функция вывода флага видимости
  getVisible(itemName: string) {
    let result = true;
    const item = this.FormControlsFlags.find(
      (p) =>
        p.controlName.toString().toLowerCase() ==
        itemName.toString().toLowerCase(),
    );
    if (item) result = item.visible;

    //console.log(itemName,result);
    return result;
  }

  //функция вывода флага доступности редактирования
  getEnabled(itemName: string) {
    let result = true;
    const item = this.FormControlsFlags.find(
      (p) =>
        p.controlName.toString().toLowerCase() ==
        itemName.toString().toLowerCase(),
    );
    if (item) result = item.enabled;
    return result;
  }

  //функция закрытия окна
  closeForm() {
    if (!this.getVisible('button_close') || !this.getEnabled('button_close'))
      return;

    this.goBack();
  }

  //кнопка назад в WebApp telegram
  goBack() {
    // //закрываем tg если смотрели товар
    // //или если мы открыли страницу с кнопкой закрыть и истории ранее нету, то закрывает телеграм
    // if (this.telegramService.IsTelegramWebAppOpened && !this.navigation.isHistoryAvailable){
    //   console.log("Закрываем Tg");
    //   this.telegramService.tg.close();
    // }

    if (
      this.telegramService.IsTelegramWebAppOpened &&
      !this.navigation.isHistoryAvailable
    ) {
      console.log('Закрываем Tg');
      this.telegramService.tg.close();
    }

    this.navigation.back();
  }

  //вызывается по окончании обновления
  onHandleUpdate() {
    this.disableButton = false;
    this.telegramService.MainButton.enable();
    if (this.getVisible('button_submit') && this.getEnabled('button_submit')) {
      this.telegramService.MainButton.setText(this.mainButtonTextValid);
      // if (this.product.id > 0) {
      //   this.telegramService.MainButton.setText(this.mainButtonTextValid);
      // } else {
      //   this.telegramService.MainButton.setText(this.mainButtonTextValid);
      // }
    }
  }

  onNameClear() {
    if (!this.form.controls['name'].disabled) {
      this.product.name = '';
      this.form.controls['name'].setValue(this.product.name);
    }
  }
  onArtikulClear() {
    if (!this.form.controls['artikul'].disabled) {
      this.product.artikul = '';
      this.form.controls['artikul'].setValue(this.product.artikul);
    }
  }
  onDescriptionClear() {
    if (!this.form.controls['description'].disabled) {
      this.product.description = '';
      this.form.controls['description'].setValue(this.product.description);
    }
  }
  onDopolnitelnoClear() {
    if (!this.form.controls['dopolnitelno'].disabled) {
      this.product.dopolnitelno = '';
      this.form.controls['dopolnitelno'].setValue(this.product.dopolnitelno);
    }
  }
  onPriceClear() {
    if (!this.form.controls['price'].disabled) {
      this.product.price = 0;
      this.form.controls['price'].setValue(this.product.price);
    }
  }
  onDiscountClear() {
    if (!this.form.controls['discount'].disabled) {
      this.product.discount = 0;
      this.form.controls['discount'].setValue(this.product.discount);
    }
  }
  onUrlClear() {
    if (!this.form.controls['url'].disabled) {
      this.product.url = '';
      this.form.controls['url'].setValue(this.product.url);
    }
  }
  onImageUrlClear() {
    if (!this.form.controls['imageUrl'].disabled) {
      this.product.imageUrl = '';
      this.form.controls['imageUrl'].setValue(this.product.imageUrl);
    }
  }
  onCategoryClear() {
    if (!this.form.controls['category'].disabled) {
      this.product.category = '';
      this.form.controls['category'].setValue(this.product.category);
      this.categoryChanging('');
    }
  }
  onTypeClear() {
    if (!this.form.controls['type'].disabled) {
      this.product.type = '';
      this.form.controls['type'].setValue(this.product.type);
      this.typeChanging('');
    }
  }
  onBrandClear() {
    if (!this.form.controls['brand'].disabled) {
      this.product.brand = '';
      this.form.controls['brand'].setValue(this.product.brand);
      this.brandChanging('');
    }
  }
  onBrandLineClear() {
    if (!this.form.controls['brandLine'].disabled) {
      this.product.brandLine = '';
      this.form.controls['brandLine'].setValue(this.product.brandLine);
      this.brandLineChanging('');
    }
  }
  onBrandSeriesClear() {
    if (!this.form.controls['brandSeries'].disabled) {
      this.product.brandSeries = '';
      this.form.controls['brandSeries'].setValue(this.product.brandSeries);
      this.brandSeriesChanging('');
    }
  }

  public GitHubLoaded(event: any): void {
    //console.log('Loaded GitHub: ', event);
    const newImageUrl = event.content.download_url;
    if (!this.form.controls['imageUrl'].disabled && newImageUrl) {
      this.product.imageUrl = newImageUrl;
      this.form.controls['imageUrl'].setValue(this.product.imageUrl);
    }
  }

  public GitHubLoading(event: boolean): void {
    //console.log('GitHubLoading',event)
    this.disableButton = event;
  }

  categoryChanging(query: string) {
    this.categoryOptionsAuto = this.productService
      .$productCategoriesMenuTree()
      .filter(
        (p) =>
          p.name
            .toString()
            .toLowerCase()
            .indexOf(query.toString().toLowerCase()) >= 0,
      );
  }
  categoryChanged() {}
  typeChanging(query: string) {
    this.typeOptionsAuto = this.productService
      .$productTypesMenuTree()
      .filter(
        (p) =>
          p.name
            .toString()
            .toLowerCase()
            .indexOf(query.toString().toLowerCase()) >= 0,
      );
  }
  typeChanged() {}
  brandChanging(query: string) {
    this.brandOptionsAuto = this.productService
      .$productBrands()
      .filter(
        (p) =>
          p.name
            .toString()
            .toLowerCase()
            .indexOf(query.toString().toLowerCase()) >= 0,
      );
  }
  brandChanged() {}
  brandLineChanging(query: string) {
    this.brandLineOptionsAuto = this.productService
      .$productBrandLines()
      .filter(
        (p) =>
          p.name
            .toString()
            .toLowerCase()
            .indexOf(query.toString().toLowerCase()) >= 0,
      );
  }
  brandLineChanged() {}
  brandSeriesChanging(query: string) {
    this.brandSeriesOptionsAuto = this.productService
      .$productBrandSeriesList()
      .filter(
        (p) =>
          p.name
            .toString()
            .toLowerCase()
            .indexOf(query.toString().toLowerCase()) >= 0,
      );
  }
  brandSeriesChanged() {}

  testClick() {
    console.log(this.product);
  }

  downloadImage(fileName, url) {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService
        .sendToGoogleAppsScript({
          chat_id: this.telegramService.Id,
          photo: url,
          caption: fileName,
          action: 'sendphoto',
        })
        .subscribe({
          next: (data) => {
            const sendphoto_response = data;
            console.log('sendphoto data', data);

            if (
              sendphoto_response?.status == 'success' &&
              sendphoto_response?.data?.action.toString().toLowerCase() ==
                'sendphoto'
            )
              this.zone.run(() => {
                const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
                  ConfirmDialogDemoComponent,
                  {
                    data: {
                      message: 'Информационное сообщение',
                      description: sendphoto_response.message,
                      showCancelButton: false,
                    },
                  },
                );
                dialogRef.afterClosed().subscribe((result) => {
                  return;
                });
              });
          },
          error: (err) => {
            console.log('sendphoto error', err);
          },
          complete: () => {
            console.log('sendphoto complete');
          },
        });
    }
  }

  //для корректного отображения select контрола необходима функция сравнения
  compareFunction(o1: any, o2: any) {
    if (o1 == null || o2 == null) return false;
    return (
      o1.keyValues.join(' ').toLowerCase().toString() ==
      o2.keyValues.join(' ').toLowerCase().toString()
    );
  }

  selectedProductAttributeChange(item: ProductAttributeClass | null) {
    this.selectedProductAttribute = item;
  }

  removeProduct() {
    this.zone.run(() => {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: 'Удаление?',
            description:
              'Следующий товар: [' +
              this.product.name +
              '] будет удален безвозвратно. Подтвердите действие.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
          this.sendData('remove');
        }
      });
    });
  }

  detailFormChanged(event: any): void {
    //console.log('detailFormChanged',event)
    //console.log('this.form.status',this.form.status);

    if (event === false) {
      this.form.controls['detail'].setErrors({ incorrect: true });
    } else {
      this.form.controls['detail'].setErrors(null);
    }
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
