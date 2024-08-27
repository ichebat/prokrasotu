import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment.development';

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
  translit: string;
}

export interface IProductCategory {
  name: string;
  translit: string;
}

export interface IProductType {
  name: string;
  translit: string;
  category: IProductCategory;
}

export interface IProductBrand {
  name: string;
  translit: string;
  types: IProductType[];
}

export function transliterate(word):string {
  var converter = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ь: '',
    ы: 'y',
    ъ: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };

  word = word.toLowerCase();

  var answer = '';
  for (var i = 0; i < word.length; ++i) {
    if (converter[word[i]] == undefined) {
      answer += word[i];
    } else {
      answer += converter[word[i]];
    }
  }

  answer = answer.replace(/[^-0-9a-z]/g, '-');
  answer = answer.replace(/[-]+/g, '-');
  answer = answer.replace(/^\-|-$/g, '');
  return answer;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  sheetId = environment.sheetId;//'1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI';
  sheetGid = environment.sheetProductsGid;//'1383014775';
  url = environment.getProductsFromGoogleAsJSONUrl;
    // 'https://docs.google.com/spreadsheets/d/' +
    // this.sheetId +
    // '/gviz/tq?tqx=out:json&tq&gid=' +
    // this.sheetGid;
  // url = "http://cors.io/spreadsheets.google.com/feeds/list/"+this.sheetId+"/od6/public/values?alt=json";

  public $searchFilter = signal<string>('');
  private $productId = signal<string>('');
  private $selectedCategoryTranslit = signal<string>('');
  private $selectedTypeTranslit = signal<string>('');
  private $selectedBrandTranslit = signal<string>('');

  private $productsAPI = toSignal<IProduct[]>(this.getProducts());

  //получаем список продуктов с фильтром
  $products = computed(() => {
    const productsAPIValue = this.$productsAPI();
    const searchFilterValue = this.$searchFilter();
    const selectedCategoryTranslitValue = this.$selectedCategoryTranslit();
    const selectedTypeTranslitValue = this.$selectedTypeTranslit();
    const selectedBrandTranslitValue = this.$selectedBrandTranslit();

    if (productsAPIValue == undefined) {
      return [] as IProduct[];
    } else {
      const filteredArray = productsAPIValue.filter((p) => {
        return (
          p.name.toLowerCase().indexOf(searchFilterValue.toLowerCase()) >= 0
          && (transliterate(p.category).toString().toLowerCase() === selectedCategoryTranslitValue.toString().toLowerCase() || !selectedCategoryTranslitValue)
          && (transliterate(p.type).toString().toLowerCase() === selectedTypeTranslitValue.toString().toLowerCase() || !selectedTypeTranslitValue)
          && (transliterate(p.brand).toString().toLowerCase() === selectedBrandTranslitValue.toString().toLowerCase() || !selectedBrandTranslitValue)
        );
      });
      //если пользуемся поиском без выбора типа то выводим первые 10 продуктов
      return filteredArray;//searchFilterValue && !selectedTypeTranslitValue ? filteredArray.splice(0,10) : filteredArray;
      //return (searchFilterValue ) ? filteredArray.splice(filteredArray.length>10 ? 10: filteredArray.length-1) : filteredArray;
    }
  });

  //получаем список категорий из списка продуктов
  $productCategories = computed(() => {
    const productsAPIValue = this.$productsAPI();
    if (productsAPIValue == undefined) {
      return [] as IProductCategory[];
    } else {
      return productsAPIValue.reduce((group, prod) => {
        if (!group) group = [] as IProductCategory[];
        if (!group.find((item) => item.name == prod.category)) {
          group.push({
            name: prod.category,
            translit: transliterate(prod.category),
          });
        }
        return group.sort((a, b) => a.name.localeCompare(b.name));
      }, [] as IProductCategory[]);
    }
  });

  //получаем список подкатегорий из списка продуктов
  $productTypes = computed(() => {
    const productsAPIValue = this.$productsAPI();
    if (productsAPIValue == undefined) {
      return [] as IProductType[];
    } else {
      return productsAPIValue.reduce((group, prod) => {
        if (!group) group = [] as IProductType[];
        if (
          !group.find(
            (item) =>
              item.name == prod.type && item.category.name == prod.category,
          )
        ) {
          group.push({
            category: {
              name: prod.category,
              translit: transliterate(prod.category),
            },
            name: prod.type,
            translit: transliterate(prod.type),
          });
        }
        return group.sort((a, b) => a.name.localeCompare(b.name));
      }, [] as IProductType[]);
    }
  });

  //получаем список брендов из списка продуктов
  $productBrands = computed(() => {
    const productsAPIValue = this.$productsAPI();
    if (productsAPIValue == undefined) {
      return [] as IProductBrand[];
    } else {
      return productsAPIValue.reduce((group, prod) => {
        if (!group) group = [] as IProductBrand[];
        if (!group.find((item) => item.name == prod.brand)) {
          const newBrandItem = {
            name: prod.brand,
            translit: transliterate(prod.brand),
            types: [] as IProductType[],
          };

          
          newBrandItem.types = productsAPIValue.filter(p => p.brand == prod.brand).reduce((group2, prod2) => {
            if (
              !group2.find(
                (item) => item.name == prod2.type && item.category.name == prod2.category,
              )
            ) {
              group2.push({
                name: prod2.type,
                translit: transliterate(prod2.type),
                category: {
                  name: prod2.category,
                  translit: transliterate(prod2.category),
                },
              });
            }
            return group2;
          }, [] as IProductType[]);

          group.push({
            name: prod.brand,
            translit: transliterate(prod.brand),
            types: newBrandItem.types,
          });
        }
        return group.sort((a, b) => a.name.localeCompare(b.name));
      }, [] as IProductBrand[]);
    }
  });

  //выбранный продукт при переходе по маршруту /product/:id
  $product = computed(() => {
    const productsAPIValue = this.$productsAPI();
    const productIdValue = this.$productId();
    if (productsAPIValue == undefined) {
      return null;
    } else {
      return productsAPIValue.find((p) => {
        return (
          p.id.toString().toLowerCase() ===
          productIdValue.toString().toLowerCase()
        );
      });
    }
  });

  //выбранная категория при переходе по маршруту /shop/:category
  $productCategory = computed(() => {
    const categoriesValue = this.$productCategories();
    const selectedCategoryTranslitValue = this.$selectedCategoryTranslit();
    if (categoriesValue == undefined) {
      return null;
    } else {
      return categoriesValue.find((p) => {
        return (
          p.translit.toString().toLowerCase() ===
          selectedCategoryTranslitValue.toString().toLowerCase()
        );
      });
    }
  });

  //выбранный тип при переходе по маршруту /shop/:category/:type
  $productType = computed(() => {
    const typesValue = this.$productTypes();
    const selectedCategoryTranslitValue = this.$selectedCategoryTranslit();
    const selectedTypeTranslitValue = this.$selectedTypeTranslit();
    if (typesValue == undefined) {
      return null;
    } else {
      return typesValue.find((p) => {
        return (
          p.translit.toString().toLowerCase() ===
          selectedTypeTranslitValue.toString().toLowerCase()
          && 
          p.category.translit.toString().toLowerCase() ===
          selectedCategoryTranslitValue.toString().toLowerCase()
        );
      });
    }
  });

  //выбранный бренд при переходе по маршруту /shop/:category/:type/:brand
  $productBrand = computed(() => {
    const brandsValue = this.$productBrands();
    const selectedCategoryTranslitValue = this.$selectedCategoryTranslit();
    const selectedTypeTranslitValue = this.$selectedTypeTranslit();
    const selectedBrandTranslitValue = this.$selectedBrandTranslit();    

    if (brandsValue == undefined) {
      return null;
    } else {
      return brandsValue.find((p) => {
        return (
          p.translit.toString().toLowerCase() ===
          selectedBrandTranslitValue.toString().toLowerCase()
          &&
          p.types.findIndex(t => t.translit.toString().toLowerCase() === selectedTypeTranslitValue.toString().toLowerCase() &&
          t.category.translit.toString().toLowerCase() === selectedCategoryTranslitValue.toString().toLowerCase())>=0
        );
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

  updateSelectedCategoryTranslit(categoryNameTranslit) {
    //console.log('try set category by '+categoryNameTranslit);
    const categoryNameTranslitValue = categoryNameTranslit ? categoryNameTranslit : '';
    this.$selectedCategoryTranslit.set(categoryNameTranslitValue);
     
    // console.log(this.$productCategories());
    // if (!categoryNameTranslit || this.$productCategories().length ==0) this.$selectedCategoryName.set('');
    // else
    // this.$selectedCategoryName.set(this.$productCategories()!.find(p => p.translit == categoryNameTranslit)!.name);
    // console.log("signal category is set to "+this.$selectedCategoryName());
  }

  updateSelectedTypeTranslit(typeNameTranslit) {
    const typeNameTranslitValue = typeNameTranslit ? typeNameTranslit : '';
    this.$selectedTypeTranslit.set(typeNameTranslitValue);
    // console.log('try set type by '+typeNameTranslit);
    // if (!typeNameTranslit || this.$productTypes().length ==0) this.$selectedTypeName.set('');
    // else
    // this.$selectedTypeName.set(this.$productTypes().find(p => p.translit == typeNameTranslit)!.name);
  }

  updateSelectedBrandTranslit(brandNameTranslit) {
    const brandNameTranslitValue = brandNameTranslit ? brandNameTranslit : '';
    this.$selectedBrandTranslit.set(brandNameTranslitValue);
    // console.log('try set brand by '+brandNameTranslit);
    // if (!brandNameTranslit || this.$productBrands().length ==0) this.$selectedBrandName.set('');
    // else
    // this.$selectedBrandName.set(this.$productBrands().find(p => p.translit == brandNameTranslit)!.name);
  }

  constructor(private _http: HttpClient) {}

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
            translit: transliterate(row.c[ProductColumns.colName]
              ? row.c[ProductColumns.colName].v
              : ''),
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

  // transliterate(word):string {
  //   var converter = {
  //     а: 'a',
  //     б: 'b',
  //     в: 'v',
  //     г: 'g',
  //     д: 'd',
  //     е: 'e',
  //     ё: 'e',
  //     ж: 'zh',
  //     з: 'z',
  //     и: 'i',
  //     й: 'y',
  //     к: 'k',
  //     л: 'l',
  //     м: 'm',
  //     н: 'n',
  //     о: 'o',
  //     п: 'p',
  //     р: 'r',
  //     с: 's',
  //     т: 't',
  //     у: 'u',
  //     ф: 'f',
  //     х: 'h',
  //     ц: 'c',
  //     ч: 'ch',
  //     ш: 'sh',
  //     щ: 'sch',
  //     ь: '',
  //     ы: 'y',
  //     ъ: '',
  //     э: 'e',
  //     ю: 'yu',
  //     я: 'ya',
  //   };

  //   word = word.toLowerCase();

  //   var answer = '';
  //   for (var i = 0; i < word.length; ++i) {
  //     if (converter[word[i]] == undefined) {
  //       answer += word[i];
  //     } else {
  //       answer += converter[word[i]];
  //     }
  //   }

  //   answer = answer.replace(/[^-0-9a-z]/g, '-');
  //   answer = answer.replace(/[-]+/g, '-');
  //   answer = answer.replace(/^\-|-$/g, '');
  //   return answer;
  // }
}
