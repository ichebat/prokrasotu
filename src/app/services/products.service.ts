import { I18nPluralPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

const domain = 'https://result.school';

export enum ProductType{
  Empty = '',
  Skill = 'skill',
  Intensive = 'intensive',
  Course = 'course',
}

export interface IProduct{
  id: string;
  text: string;
  title: string;
  link: string;
  image: string;
  time: string;
  type: string;
}

// function stringToEnum(value: string, enumType: { [key: string]: string }): string | undefined {
//   for (let key in enumType) {
//       if (enumType[key] === value) {
//           return key;
//       }
//   }
//   return undefined;
// }

// function convertJsonToIProduct(json:any)
// {
//   const data:IProduct[] = [];
//   const cols = json.table.cols;
//   const rows = json.table.rows;
//   rows.forEach(row => {
//     const product = {};
//     //console.log(row.c[0].v, row.c[1].v, row.c[2].v);
//     // Output: id, name, package_name
//   });
// }

export function AddDomainToLinkAndImage(product: IProduct)
{
  return{
    ...product,
    image: domain+product.image,
    link: domain+product.link,
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private _product$ = new BehaviorSubject<any>({});
  product$ = this._product$.asObservable();

  private _productList$ = new BehaviorSubject<any>([]);
  productList$ = this._productList$.asObservable();

  //products: IProduct[]=[];


  sheetId = "1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI";
  sheetGid = "1383014775";
  url = "https://docs.google.com/spreadsheets/d/"+this.sheetId+"/gviz/tq?tqx=out:json&tq&gid="+this.sheetGid;
  // url = "http://cors.io/spreadsheets.google.com/feeds/list/"+this.sheetId+"/od6/public/values?alt=json";


  constructor(private _http: HttpClient) {
    
    //this.products = [];
    //this.fetchProducts();
   }

  setProduct(product: any) {
    this._product$.next(product);
  }

  setProductList(productList: any[]) {
    this._productList$.next(productList);
  }

  //  fetchProducts(){    
  //   var prodList:IProduct[]=[];
  //   console.log("Start get products");
  //   this.getProducts().subscribe(res => {
  //     const json = JSON.parse(res.substring(47, res.length - 2));
  //     const cols = json.table.cols;
  //     const rows = json.table.rows;
  //     rows.forEach(row => {
  //       var product: IProduct = {id : row.c[0].v, title: row.c[1].v, link: row.c[2].v, image: row.c[3].v, text: row.c[4].v, time: row.c[5].v, type: row.c[6].v};
  //       prodList.push(product);     
  //     });
  //     this.products = prodList.map(AddDomainToLinkAndImage);      
  //   });
  // } 

  // getProducts(): Observable<any> {
  //   return this._http.get(this.url, {responseType:'text'});//, { headers: { Accept: 'application/json' } });
  // }

  getProducts(): Observable<IProduct[]> {
  //getProducts(forceUpdate: boolean): Observable<IProduct[]> {
    
    // if (forceUpdate || (forceUpdate == false && this._productList$.getValue().length == 0))
    // {
      console.log("Start get products");
      return this._http.get(this.url, {responseType:'text'}).pipe(map((res:any)=>{
        let gsDataJSON = JSON.parse(res.substring(47, res.length - 2));
        //console.log(gsDataJSON);
        return gsDataJSON.table.rows
          .map(function(row: any): IProduct {
            return {id : row.c[0].v, title: row.c[1].v, link: row.c[2].v, image: row.c[3].v, text: row.c[4].v, time: row.c[5].v, type: row.c[6].v};
          })
          .map(AddDomainToLinkAndImage);
      }));
    // }
    //  else 
    //  return this._productList$;
  }

  getById(id: string){
    
    console.log("Start get product by id = "+id);
    //console.log(this._productList$.getValue());
    if (this._productList$.getValue().length == 0)
    {
      this.getProducts().subscribe(res => {
        let prod = res.find(p => p.id == id);        
        this.setProduct(prod);
        return prod; 
      });
    }
    else
    {
        let prod = this._productList$.getValue().find(p => p.id == id);
        this.setProduct(prod);
        return prod;
    }
  }

  get byGroup(){    
    return this._productList$.getValue().reduce((group, prod)=>{
      if (!group[prod.type]){
        group[prod.type] = [];
      }
      group[prod.type].push(prod);
      return group;
    }, {});
  }
  
}
