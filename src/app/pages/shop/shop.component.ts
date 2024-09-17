import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { TelegramService } from '../../services/telegram.service';
import { IProduct, ProductsService } from '../../services/products.service';
import { catchError, map, Observable, of, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';
import { OrderService } from '../../services/order.service';
import { DeliveryService } from '../../services/delivery.service';
import { CartService } from '../../services/cart.service';
import { Buffer } from 'buffer';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
})
export class ShopComponent implements OnInit, OnDestroy {
  telegram = inject(TelegramService);
  navigation = inject(NavigationService);

  //@Input('category') categoryFromRoute = '';
  @Input() set category(category: string) {
    this.productsService.updateSelectedCategoryTranslit(category);
    if (category) {
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
    } else this.telegramService.BackButton.hide();
  }
  @Input() set type(type: string) {
    this.productsService.updateSelectedTypeTranslit(type);
    if (type)
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
  }
  @Input() set brand(brand: string) {
    this.productsService.updateSelectedBrandTranslit(brand);
    if (brand)
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
  }
  @Input() set brandLine(brandLine: string) {
    this.productsService.updateSelectedBrandLineTranslit(brandLine);
    if (brandLine)
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
  }
  @Input() set brandSeries(brandSeries: string) {
    //console.log("brandSeries: "+brandSeries);
    this.productsService.updateSelectedBrandSeriesTranslit(brandSeries);
    if (brandSeries)
      if (this.telegramService.IsTelegramWebAppOpened) {
        this.telegramService.BackButton.show();
      }
  }
  // @Input('type') typeFromRoute = '';
  // @Input('brand') brandFromRoute = '';

  // category;
  // type;
  // brand;

  // categorySignal = computed(()=>{
  //   const category = this.productsService.$productCategory();
  //   return !category? "" : category.name;
  // });

  // typeSignal = computed(()=>{
  //   const type = this.productsService.$productType();
  //   return !type? "" : type.name;
  // });

  // brandSignal = computed(()=>{
  //   const brand = this.productsService.$productBrand();
  //   return !brand? "" : brand.name;
  // });

  //subscription: Subscription;

  //products: IProduct[] = [];

  /**
   *
   */

  tgString = JSON.stringify(this.telegram.tg);

  constructor(
    public productsService: ProductsService,
    public deliveryService: DeliveryService,
    private cartService: CartService,
    //private orderService: OrderService,
    private telegramService: TelegramService,
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {
    //если запустили телеграм бота по webAppDirectLink с параметром https://t.me/botusername/appname?startapp=someParamValue
    //то считываем someParamValue и парсим для перехода
    if (!this.telegramService.isRedirectedByStartParam)
      if (this.telegramService.StartParam) {
        let routeUrl = this.telegramService.StartParam;
        console.log('Redirecting to ' + routeUrl);
        this.telegramService.isRedirectedByStartParam = true;
        this.router.navigate([routeUrl]);
      }

    //console.log("Constructor Shop");

    // this.category = this.route.snapshot.paramMap.get('category');
    // this.type = this.route.snapshot.paramMap.get('type');
    // this.brand = this.route.snapshot.paramMap.get('brand');

    // console.log(this.category);
    // console.log(this.type);
    // console.log(this.brand);
    // console.log(this.productsService.$selectedCategoryName());
    // console.log(this.productsService.$selectedTypeName());
    // console.log(this.productsService.$selectedBrandName());

    // this.productsService.updateSelectedCategoryName(this.category);
    // this.productsService.updateSelectedTypeName(this.type);
    // this.productsService.updateSelectedBrandName(this.brand);

    //this.telegram.MainButton.show();
    //this.telegram.BackButton.hide();

    // let category = '';
    // let type = '';

    // if (this.route.snapshot.queryParamMap.get('category')) category = this.route.snapshot.queryParamMap.get('category')!;
    // if (this.route.snapshot.queryParamMap.get('type')) type = this.route.snapshot.queryParamMap.get('type')!;

    // console.log("cat = "+category+" && type = "+type);

    // this.productsService.updateSelectedCategory(category);
    // this.productsService.updateSelectedType(type);
    // this.subscription = this.productsService.productList$.subscribe((value) => {
    //   this.products = value;
    // });

    // this.productsService.getProducts().subscribe((res) => {
    //   //this.products =  res;
    //   this.productsService.setProductList(res);
    // });

    this.goBack = this.goBack.bind(this);
  }

  selectedFile: any = '';
  selectedFileBuffer: any = '';

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] ?? '';
    this.selectedFileBuffer = event.target.files[0].arrayBuffer() ?? '';
    console.log(this.selectedFileBuffer);
    
    var base64String;
    const fileReader = new FileReader();
    fileReader.onload = () => {
      base64String = fileReader.result;
      console.log(base64String);
      (async()=>{


        console.clear();
  
  
        var file        = base64String;
  
        console.log('file: '+base64String);
        var message     = 'uploading test2.png';
  
        var owner       = 'ichebat';
        var repo        = 'prokrasotucdn';
        var path        = 'uploads/test2.png';
        
        var token       = 'тут токен';
        
        var url         = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  
        var res         = await fetch(url);
        var json        = await res.json();
        var sha         = json.sha;
        
        
        var content     = window.btoa(file);
        
        var body        = sha?{content,sha,message}:{content,message};      
        var bodyStr     = JSON.stringify(body);
        
        var headers     = {authorization:`Bearer ${token}`};
        var opts        = {method:'put',headers, bodyStr};
  
        return this.http
               .put(url, bodyStr, {headers: headers})
               .subscribe({
                next: (data) => {
                  console.log('put github api data', data);
                },
                error: (err) => {
                  console.log('put github api error', err);
                },
                complete: () => {
                  console.log('put github api complete');
                },
              });
        
        // var res         = await fetch(url,opts);
        // var json        = await res.json();
  
        
        // console.log('result :',res.status,res.statusText);
        // console.log();
        // console.log(JSON.stringify(json,null,4));
      })();
    };
    fileReader.readAsBinaryString(this.selectedFile);

   // return;
    
    

    //console.log(this.selectedFileBuffer);
  }

  // async imageUploadToPostimages() {
  //   const service = new ImageUploadService('postimages.org');
  //   try {
  //     //var fs = require('file-system');
  //     let { directLink } = await service.uploadFromBinary(
  //       Buffer.from(this.selectedFileBuffer),
  //       'test.png',
  //     );
  //     console.log(directLink);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.hide();
      this.telegramService.BackButton.offClick(this.goBack);
    }
    //this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
    }

    // console.log("Init Shop, routes: "+this.category+','+this.typeFromRoute+','+this.brandFromRoute);
    // if (this.category) this.productsService.updateSelectedCategoryName(this.category);
    // else this.productsService.updateSelectedCategoryName('');
    // if (this.typeFromRoute) this.productsService.updateSelectedTypeName(this.typeFromRoute);
    // else this.productsService.updateSelectedTypeName('');
    // if (this.brandFromRoute) this.productsService.updateSelectedBrandName(this.brandFromRoute);
    // else this.productsService.updateSelectedBrandName('');
    //   this.route.paramMap.subscribe(paramMap => {
    //     console.log("subscribe param");
    //     this.category = paramMap.get('category');
    //     this.type = paramMap.get('type');
    //     this.brand = paramMap.get('brand');

    //     this.productsService.updateSelectedCategoryName(this.category);
    //     //console.log("signal category is set to "+this.productsService.$selectedCategoryName());
    //     this.productsService.updateSelectedTypeName(this.type);
    //     this.productsService.updateSelectedBrandName(this.brand);
    // });

    // this.route.queryParams.subscribe(
    //   params => {
    //     this.productsService.updateSelectedCategory(params['category']!);
    //     this.productsService.updateSelectedType(['language']!);
    //   }
    // )

    // this.productsService.getProducts(false).subscribe(res => {
    //     //this.products =  res;
    //     console.log(res);
    //     this.productsService.setProductList(res);
    //   });

    // this.subscription = this.productsService.productList$.subscribe((value) => {
    //   this.products = value;
    // });

    // console.log(this.productsService.$productCategories());
    // console.log(this.productsService.$productTypes());
    // console.log(this.productsService.$productBrands());
  }

  // stringToEnum(value: string, enumType: { [key: string]: string }): string | undefined {
  //   for (let key in enumType) {
  //       if (enumType[key] === value) {
  //           return key;
  //       }
  //   }
  //   return undefined;
  // }

  // fetchProducts(){
  //   var prodList:IProduct[]=[];
  //   console.log("Start get products");
  //   this.productsService.getProducts().subscribe(res => {
  //     //this.productsService.products = [];
  //     //console.log('res', res);
  //     const json = JSON.parse(res.substring(47, res.length - 2));
  //     const cols = json.table.cols;
  //     const rows = json.table.rows;
  //     rows.forEach(row => {
  //       // let productType = this.stringToEnum(row.c[6].v, ProductType);
  //       var product: IProduct = {id : row.c[0].v, title: row.c[1].v, link: row.c[2].v, image: row.c[3].v, text: row.c[4].v, time: row.c[5].v, type: row.c[6].v};

  //       //this.productsService.products.push(product);
  //       prodList.push(product);
  //     });
  //     this.productsService.products = prodList.map(AddDomainToLinkAndImage);
  //     //console.log('products0', this.productsService.products);
  //     //return prodList.map(this.productsService.AddDomainToLinkAndImage);

  //   });
  //   //console.log(prodList);
  //   //return prodList.map(this.productsService.AddDomainToLinkAndImage);

  // }

  onSearchClear() {
    this.productsService.updateFilter('');
  }

  goBack() {
    //this.router.navigate(['']);
    //this.location.back();
    this.navigation.back();
  }

  btnClick() {
    console.log('productBrandLines');
    console.log(this.productsService.$productBrandLines());

    console.log('productBrandSeriesList');
    console.log(this.productsService.$productBrandSeriesList());
  }
}
