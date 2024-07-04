import { Component, OnInit, inject } from '@angular/core';
import { TelegramService } from '../../services/telegram.service';
import { AddDomainToLinkAndImage, IProduct, ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html'
})
export class ShopComponent implements OnInit{
  telegram = inject(TelegramService);

  products: IProduct[]=[];

  /**
   *
   */
  constructor(public productsService: ProductsService) {
    //this.telegram.MainButton.show(); 
    this.telegram.BackButton.hide(); 

    this.productsService.getProducts(  ).subscribe(res => {
      this.products =  res;
      this.productsService.setProductList(res);
    });
  }

  ngOnInit(): void {
    // this.productsService.getProducts(false).subscribe(res => {
    //     //this.products =  res;
    //     console.log(res);
    //     this.productsService.setProductList(res);
    //   });

    this.productsService.productList$.subscribe((value) => {
      this.products = value;
    });
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

}
