import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export enum ProductColumns {
  colId = 0,
  colUrl = 1,
  colArtikul = 2,
  colCategory = 3,
  colType = 4,
  colBrand = 5,
  colName = 6,
  colDescription = 7,
  colDopolnitelno = 8,
  colImageUrl = 9,
  colPrice = 10,
  colDiscount = 11,
  colIsNew = 12,
}

export interface IProduct {
  id: string;
  url: string;
  artikul: string;
  category: string;
  type: string;
  brand: string;
  name: string;
  description: string;
  dopolnitelno: string;
  imageUrl: string;
  price: number;
  discount: number;
  isNew: boolean;
}


@Injectable({
  providedIn: 'root',
})
export class ProductsService {

  sheetId = '1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI';
  sheetGid = '1383014775';
  url =
    'https://docs.google.com/spreadsheets/d/' +
    this.sheetId +
    '/gviz/tq?tqx=out:json&tq&gid=' +
    this.sheetGid;
  // url = "http://cors.io/spreadsheets.google.com/feeds/list/"+this.sheetId+"/od6/public/values?alt=json";

  private $searchFilter = signal<string>('');
  private $productId = signal<string>('');
  private $productsAPI = toSignal<IProduct[]>(
    this.getProducts(),
  );

  $products = computed(() => {
    const productsAPIValue = this.$productsAPI();
    const searchFilterValue = this.$searchFilter();
    if (productsAPIValue == undefined) {
      return [] as IProduct[];
    } else {
      return productsAPIValue.filter((p) => {
        return p.name.toLowerCase().indexOf(searchFilterValue) >= 0;
      });
    }
  });

  $product = computed(() => {
    const productsAPIValue = this.$productsAPI();
    const productIdValue = this.$productId();
    if (productsAPIValue == undefined) {
      return null;
    } else {
      return productsAPIValue.find((p) => {
        return p.id.toString().toLowerCase() === productIdValue.toString().toLowerCase();
      });
    }
  });

  updateFilter(filter: string) {
    const filterValue = filter.length > 3 ? filter : '';
    this.$searchFilter.set(filterValue);
  }

  updateId(id) {
    this.$productId.set(id);
  }

  constructor(private _http: HttpClient) {
    
  }

  getProducts(): Observable<IProduct[]> {
    
    console.log('Start get products');
    return this._http.get(this.url, { responseType: 'text' }).pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res.substring(47, res.length - 2));
        //console.log(gsDataJSON);
        return gsDataJSON.table.rows.map(function (row: any): IProduct {
         
          return {
            id: row.c[ProductColumns.colId]
              ? row.c[ProductColumns.colId].v
              : '',
            url: row.c[ProductColumns.colUrl]
              ? row.c[ProductColumns.colUrl].v
              : '',
            artikul: row.c[ProductColumns.colArtikul]
              ? row.c[ProductColumns.colArtikul].v
              : '',
            category: row.c[ProductColumns.colCategory]
              ? row.c[ProductColumns.colCategory].v
              : '',
            type: row.c[ProductColumns.colType]
              ? row.c[ProductColumns.colType].v
              : '',
            brand: row.c[ProductColumns.colBrand]
              ? row.c[ProductColumns.colBrand].v
              : '',
            name: row.c[ProductColumns.colName]
              ? row.c[ProductColumns.colName].v
              : '',
            description: row.c[ProductColumns.colDescription]
              ? row.c[ProductColumns.colDescription].v
              : '',
            dopolnitelno: row.c[ProductColumns.colDopolnitelno]
              ? row.c[ProductColumns.colDopolnitelno].v
              : '',
            imageUrl: row.c[ProductColumns.colImageUrl]
              ? row.c[ProductColumns.colImageUrl].v
              : '',
            price: row.c[ProductColumns.colPrice]
              ? row.c[ProductColumns.colPrice].v
              : 0,
            discount: row.c[ProductColumns.colDiscount]
              ? row.c[ProductColumns.colDiscount].v
              : 0,
            isNew: row.c[ProductColumns.colIsNew]
              ? row.c[ProductColumns.colIsNew].v
              : false,
          };
        });
       
      }),
    );
  }

  get byGroup() {
    return this.$products().reduce((group, prod) => {
      if (!group[prod.type]) {
        group[prod.type] = [];
      }
      group[prod.type].push(prod);
      return group;
    }, {});
  }

  get byCategory() {
    return this.$products().reduce((group, prod) => {
      if (!group[prod.category]) {
        group[prod.category] = [];
      }
      group[prod.category].push(prod);
      return group;
    }, {});
  }
}
