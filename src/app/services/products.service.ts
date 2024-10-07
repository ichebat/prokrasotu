import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment.development';
import { TelegramService } from './telegram.service';

export enum ProductColumns {
  colId = 0,
  colUrl = 1,
  colArtikul = 2,
  colCategory = 3,
  colType = 4,
  colBrand = 5,
  colBrandLine = 6,
  colBrandSeries = 7,
  colName = 8,
  colDescription = 9,
  colDopolnitelno = 10,
  colImageUrl = 11,
  colPrice = 12,
  colDiscount = 13,
  colIsNew = 14,
  colDetail = 15,
  colIsActive = 16,
}


export interface IProductAttribute {
  description: string; //название прибавится к названию продукта при выборе
  price: number; //если больше 0, то цена заменит цену продукта при выборе
  imageUrl: string; //если внесено, то заменит картинку продукта при выборе
  isActive: boolean; //возможно ли купить данный товар, если false, то временно отсутствует в продаже
  keyValues: string []; //словарь типа values[key] key берется из keys в IProductDetail
}
export class ProductAttributeClass implements IProductAttribute {
  description: string = ''; //описание, сборное их keyValues, прибавляется к названию товара при выборе
  price: number= 0; //цена
  imageUrl: string=''; //ссылка на изображение
  isActive: boolean = false; //возможно ли купить данный товар, если false, то временно отсутствует в продаже
  keyValues: string [] = [];

  constructor(obj) {
    for (var prop in obj) this[prop] = obj[prop];
  }
}

export interface IProductDetail {
  mainImageUrl: string; //общая картинка для всех характеристик
  mainImageDescription: string; //и ее описание  
  keys: string []; //свойства у родственных продуктов (уровень глубины цвета, цветовой нюанс и название для 100+ оттенков одного продукта) или (процент оксигента, объем)
  attributes: IProductAttribute[];
}

export class ProductDetailClass implements IProductDetail {
  mainImageUrl: string = '';
  mainImageDescription: string = '';
  keys: string[] = [];
  attributes: ProductAttributeClass[] = [];

  // constructor(obj) {
  //   if (obj == null){
  //     for (var prop in obj) {
  //       this[prop] = obj[prop];
  //     }
  //   } 
  //   else
  //   {
  //     this.mainImageUrl = obj.mainImageUrl;
  //     this.mainImageDescription = obj.mainImageDescription;
  //     this.keys = [] as string[];
  //     obj.keys.forEach(element => {this.keys.push(element);});
  //     this.attributes = [] as ProductAttributeClass[];
  //     obj.attributes.forEach(item => {
  //       this.attributes.push(item);
  //     });
  //   } 
  // }

  constructor(obj) {
    for (var prop in obj) this[prop] = obj[prop];
  }

  // isCorrect(){
  //   var result = true;
  //   var msg = '';
  //   //mainImageUrl и mainImageDescription заполняются вместе
  //   result = result && ((this.mainImageUrl != '' && this.mainImageDescription != '') || ((this.mainImageUrl == '' && this.mainImageDescription == '')));
  //   //keys и attributes заполняются вместе
  //   result = result && ((this.keys.length ==0 && this.attributes.length == 0) || (this.keys.length >0 && this.attributes.length > 0));

  //   return result;
  // }
}


export interface IProduct {
  id: number;
  url: string;
  artikul: string;
  category: string;
  type: string;
  brand: string;
  brandLine: string;
  brandSeries: string;
  name: string;
  description: string;
  dopolnitelno: string;
  imageUrl: string;
  price: number;
  discount: number;
  isNew: boolean;
  translit: string;
  detail: IProductDetail;
  isActive: boolean; //возможно ли купить данный товар, если false, то временно отсутствует в продаже
}

export class ProductClass implements IProduct {
  id: number = 0;
  url: string = '';
  artikul: string = '';
  category: string = '';
  type: string = '';
  brand: string = '';
  brandLine: string = '';
  brandSeries: string = '';
  name: string = '';
  description: string = '';
  dopolnitelno: string = '';
  imageUrl: string = '';
  price: number = 0;
  discount: number = 0;
  isNew: boolean = false;
  translit: string = '';
  detail: ProductDetailClass = new ProductDetailClass(null);
  isActive: boolean = false;

  constructor(obj) {
    for (var prop in obj) this[prop] = obj[prop];
  }
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

export interface IProductBrandLine {
  name: string;
  translit: string;
  brands: IProductBrand[];
}

export interface IProductBrandSeries {
  name: string;
  translit: string;
  brandLines: IProductBrandLine[];
}

export function transliterate(word): string {
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
  sheetId = environment.sheetId; //'1JPSzoAEUktlPgShanrrdZs3Vb5YwQVzlTeog8JmzWrI';
  sheetGid = environment.sheetProductsGid; //'1383014775';
  url = environment.getProductsFromGoogleAsJSONUrl;
  // 'https://docs.google.com/spreadsheets/d/' +
  // this.sheetId +
  // '/gviz/tq?tqx=out:json&tq&gid=' +
  // this.sheetGid;
  // url = "http://cors.io/spreadsheets.google.com/feeds/list/"+this.sheetId+"/od6/public/values?alt=json";

  public $searchFilter = signal<string>('');
  public $searchFilterIsNew = signal<boolean>(false);
  private $productId = signal<string>('');
  private $selectedCategoryTranslit = signal<string>('');
  private $selectedTypeTranslit = signal<string>('');
  private $selectedBrandTranslit = signal<string>('');
  private $selectedBrandLineTranslit = signal<string>('');
  private $selectedBrandSeriesTranslit = signal<string>('');

  //private $productsAPI = toSignal<IProduct[]>(this.getProducts());
  productsResponseChanged = new BehaviorSubject<void>(undefined);
  private $productsAPI = toSignal<IProduct[]>(
    this.productsResponseChanged.pipe(
      switchMap(() =>
      this.getProducts(),
      ),
    ),
    { initialValue: null },
  );

  telegram = inject(TelegramService);

  //получаем список продуктов с фильтром
  $products = computed(() => {
    const productsAPIValue = this.$productsAPI();
    const searchFilterValue = this.$searchFilter();
    const searchFilterIsNewValue = this.$searchFilterIsNew();
    const selectedCategoryTranslitValue = this.$selectedCategoryTranslit();
    const selectedTypeTranslitValue = this.$selectedTypeTranslit();
    const selectedBrandTranslitValue = this.$selectedBrandTranslit();
    const selectedBrandLineTranslitValue = this.$selectedBrandLineTranslit();
    const selectedBrandSeriesTranslitValue =
      this.$selectedBrandSeriesTranslit();

    if (productsAPIValue == undefined) {
      return [] as IProduct[];
    } else {
      const filteredArray = productsAPIValue.filter((p) => {
        return (
          (p.name.toLowerCase().indexOf(searchFilterValue.toLowerCase()) >= 0          
          || p.artikul.toLowerCase().indexOf(searchFilterValue.toLowerCase()) >= 0
          || (p.detail.attributes.find(a=>a.description.toLowerCase().indexOf(searchFilterValue.toLowerCase()) >= 0))
            ) &&
          ((searchFilterIsNewValue && p.isNew) || searchFilterIsNewValue == false) &&
          (transliterate(p.category).toString().toLowerCase() ===
            selectedCategoryTranslitValue.toString().toLowerCase() ||
            !selectedCategoryTranslitValue) &&
          (transliterate(p.type).toString().toLowerCase() ===
            selectedTypeTranslitValue.toString().toLowerCase() ||
            !selectedTypeTranslitValue) &&
          (transliterate(p.brand).toString().toLowerCase() ===
            selectedBrandTranslitValue.toString().toLowerCase() ||
            !selectedBrandTranslitValue) &&
          (transliterate(p.brandLine).toString().toLowerCase() ===
            selectedBrandLineTranslitValue.toString().toLowerCase() ||
            !selectedBrandLineTranslitValue) &&
          (transliterate(p.brandSeries).toString().toLowerCase() ===
            selectedBrandSeriesTranslitValue.toString().toLowerCase() ||
            !selectedBrandSeriesTranslitValue)
        );
      });
      //если пользуемся поиском без выбора типа то выводим первые 10 продуктов
      return filteredArray; //searchFilterValue && !selectedTypeTranslitValue ? filteredArray.splice(0,10) : filteredArray;
      //return (searchFilterValue ) ? filteredArray.splice(filteredArray.length>10 ? 10: filteredArray.length-1) : filteredArray;
    }
  });

  //получаем список категорий из большого списка продуктов необходимо для MenuTree
  $productCategoriesMenuTree = computed(() => {
    const productsAPIValue = this.$productsAPI()?.filter((p) => p.category);
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

  //получаем список подкатегорий из большого списка продуктов необходимо для MenuTree
  $productTypesMenuTree = computed(() => {
    const productsAPIValue = this.$productsAPI()?.filter((p) => p.type); //this.$productsAPI();
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

  //проверяем есть ли новинки в фильтрованном списке
  $productIsNewExist = computed(() => {
    return this.$products().findIndex((p) => p.isNew == true) >=0;
  });

  //получаем список категорий из списка продуктов
  $productCategories = computed(() => {
    const productsAPIValue = this.$products().filter((p) => p.category);
    if (productsAPIValue == undefined) {
      return [] as IProductCategory[];
    } else {
      return productsAPIValue.reduce((group, prod) => {
        if (!group) group = [] as IProductCategory[];
        if (!group.find((item) => item.name.toString().toLowerCase() == prod.category.toString().toLowerCase())) {
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
    const productsAPIValue = this.$products().filter((p) => p.type); //this.$productsAPI();
    if (productsAPIValue == undefined) {
      return [] as IProductType[];
    } else {
      return productsAPIValue.reduce((group, prod) => {
        if (!group) group = [] as IProductType[];
        if (
          !group.find(
            (item) =>
              item.name.toString().toLowerCase() == prod.type.toString().toLowerCase() //&& item.category.name == prod.category,
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
    const productsAPIValue = this.$products().filter((p) => p.brand); //this.$productsAPI();
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

          newBrandItem.types = productsAPIValue
            .filter((p) => p.brand == prod.brand)
            .reduce((group2, prod2) => {
              if (
                !group2.find(
                  (item) =>
                    item.name == prod2.type &&
                    item.category.name == prod2.category,
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

  //получаем список линеек брендов из списка продуктов
  $productBrandLines = computed(() => {
    const productsAPIValue = this.$products().filter((p) => p.brandLine); //this.$productsAPI();
    if (productsAPIValue == undefined) {
      return [] as IProductBrandLine[];
    } else {
      return productsAPIValue.reduce((group, prod) => {
        if (!group) group = [] as IProductBrandLine[];
        if (!group.find((item) => item.name == prod.brandLine)) {
          const newBrandLineItem = {
            name: prod.brandLine,
            translit: transliterate(prod.brandLine),
            brands: [] as IProductBrand[],
          };

          newBrandLineItem.brands = productsAPIValue
            .filter((p) => p.brandLine && p.brandLine == prod.brandLine)
            .reduce((group2, prod2) => {
              if (!group2.find((item) => item.name == prod2.brand)) {
                group2.push({
                  name: prod2.brand,
                  translit: transliterate(prod2.brand),
                  types: [] as IProductType[],
                });
              }
              return group2;
            }, [] as IProductBrand[]);

          group.push({
            name: prod.brandLine,
            translit: transliterate(prod.brandLine),
            brands: newBrandLineItem.brands,
          });
        }

        return group.sort((a, b) => a.name.localeCompare(b.name));
      }, [] as IProductBrandLine[]);
    }
  });

  //получаем список серий для линеек брендов из списка продуктов
  $productBrandSeriesList = computed(() => {
    const productsAPIValue = this.$products().filter((p) => p.brandSeries); //this.$productsAPI();
    if (productsAPIValue == undefined) {
      return [] as IProductBrandSeries[];
    } else {
      return productsAPIValue.reduce((group, prod) => {
        if (!group) group = [] as IProductBrandSeries[];
        if (!group.find((item) => item.name == prod.brandSeries)) {
          const newBrandSeriesItem = {
            name: prod.brandSeries,
            translit: transliterate(prod.brandSeries),
            brandLines: [] as IProductBrandLine[],
          };

          newBrandSeriesItem.brandLines = productsAPIValue
            .filter((p) => p.brandSeries == prod.brandSeries)
            .reduce((group2, prod2) => {
              if (!group2.find((item) => item.name == prod2.brandLine)) {
                group2.push({
                  name: prod2.brandLine,
                  translit: transliterate(prod2.brandLine),
                  brands: [] as IProductBrand[],
                });
              }
              return group2;
            }, [] as IProductBrandLine[]);

          group.push({
            name: prod.brandSeries,
            translit: transliterate(prod.brandSeries),
            brandLines: newBrandSeriesItem.brandLines,
          });
        }
        return group.sort((a, b) => a.name.localeCompare(b.name));
      }, [] as IProductBrandSeries[]);
    }
  });

  //выбранный продукт при переходе по маршруту /product/:id
  $product = computed(() => {
    const productsAPIValue = this.$productsAPI();
    const productIdValue = this.$productId();
    if (productsAPIValue == undefined) {
      return null;
    } else 
    {
      if (!productIdValue || parseInt(productIdValue) <= 0 || productIdValue.toLowerCase() == 'new') {
        return {
          id: 0,
          url: '',
          artikul: '',
          category: '',
          type: '',
          brand: '',
          brandLine: '',
          brandSeries: '',
          name: '',
          description: '',
          dopolnitelno: '',
          imageUrl: '',
          price: 0,
          discount: 0,
          isNew: false,
          translit: '',
          detail: new ProductDetailClass(null),
          isActive: false
        };
      } else {
        //console.log('productIdValue',productIdValue);
        return productsAPIValue.find((p) => {
          return (
            p.id.toString().toLowerCase() ===
            productIdValue.toString().toLowerCase()
          );
        });
      }
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
            selectedTypeTranslitValue.toString().toLowerCase() &&
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
            selectedBrandTranslitValue.toString().toLowerCase() &&
          p.types.findIndex(
            (t) =>
              t.translit.toString().toLowerCase() ===
                selectedTypeTranslitValue.toString().toLowerCase() &&
              t.category.translit.toString().toLowerCase() ===
                selectedCategoryTranslitValue.toString().toLowerCase(),
          ) >= 0
        );
      });
    }
  });

  //выбранная линейка бренда при переходе по маршруту /shop/:category/:type/:brand/:brandLine
  $productBrandLine = computed(() => {
    const brandLinesValue = this.$productBrandLines();
    const selectedCategoryTranslitValue = this.$selectedCategoryTranslit();
    const selectedTypeTranslitValue = this.$selectedTypeTranslit();
    const selectedBrandTranslitValue = this.$selectedBrandTranslit();
    const selectedBrandLineTranslitValue = this.$selectedBrandLineTranslit();

    //console.log(selectedBrandTranslitValue);

    if (brandLinesValue == undefined) {
      return null;
    } else {
      return brandLinesValue.find((p) => {
        return (
          p.translit.toString().toLowerCase() ===
            selectedBrandLineTranslitValue.toString().toLowerCase() &&
          p.brands.findIndex(
            (t) =>
              t.translit.toString().toLowerCase() ===
              selectedBrandTranslitValue.toString().toLowerCase(),
          ) >= 0
        );
      });
    }
  });

  //выбранная линейка бренда при переходе по маршруту /shop/:category/:type/:brand/:brandLine/:brandSeries
  $productBrandSeries = computed(() => {
    const brandSeriesListValue = this.$productBrandSeriesList();
    const selectedCategoryTranslitValue = this.$selectedCategoryTranslit();
    const selectedTypeTranslitValue = this.$selectedTypeTranslit();
    const selectedBrandTranslitValue = this.$selectedBrandTranslit();
    const selectedBrandLineTranslitValue = this.$selectedBrandLineTranslit();
    const selectedBrandSeriesTranslitValue =
      this.$selectedBrandSeriesTranslit();

    if (brandSeriesListValue == undefined) {
      return null;
    } else {
      return brandSeriesListValue.find((p) => {
        return (
          p.translit.toString().toLowerCase() ===
            selectedBrandSeriesTranslitValue.toString().toLowerCase() &&
          // &&
          // p.brandLine.brand.translit.toString().toLowerCase() === selectedBrandTranslitValue.toString().toLowerCase()
          p.brandLines.findIndex(
            (t) =>
              t.translit.toString().toLowerCase() ===
              selectedBrandLineTranslitValue.toString().toLowerCase(),
          ) >= 0
        );
      });
    }
  });

  updateFilter(filter: string) {
    const filterValue = filter.length >= 3 ? filter : '';
    this.$searchFilter.set(filterValue);
  }

  updateFilterIsNew(filter: boolean) {
    const filterIsNewValue = filter;
    this.$searchFilterIsNew.set(filterIsNewValue);//.toString().toLowerCase() === 'true');
    //console.log(filterIsNewValue);
  }  

  updateId(id) {
    this.$productId.set(id);
  }

  updateProductsApi() {
    this.productsResponseChanged.next();
  }

  updateSelectedCategoryTranslit(categoryNameTranslit) {
    //console.log('try set category by '+categoryNameTranslit);
    const categoryNameTranslitValue = categoryNameTranslit
      ? categoryNameTranslit
      : '';
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

  updateSelectedBrandLineTranslit(brandLineNameTranslit) {
    const brandLineNameTranslitValue = brandLineNameTranslit
      ? brandLineNameTranslit
      : '';
    this.$selectedBrandLineTranslit.set(brandLineNameTranslitValue);
    // console.log('try set brand by '+brandNameTranslit);
    // if (!brandNameTranslit || this.$productBrands().length ==0) this.$selectedBrandName.set('');
    // else
    // this.$selectedBrandName.set(this.$productBrands().find(p => p.translit == brandNameTranslit)!.name);
  }

  updateSelectedBrandSeriesTranslit(brandSeriesNameTranslit) {
    const brandSeriesNameTranslitValue = brandSeriesNameTranslit
      ? brandSeriesNameTranslit
      : '';
    this.$selectedBrandSeriesTranslit.set(brandSeriesNameTranslitValue);
    // console.log('try set brand by '+brandNameTranslit);
    // if (!brandNameTranslit || this.$productBrands().length ==0) this.$selectedBrandName.set('');
    // else
    // this.$selectedBrandName.set(this.$productBrands().find(p => p.translit == brandNameTranslit)!.name);
  }

  constructor(private _http: HttpClient) {}

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  //только админ видит все, другие только ненулевые цены и доступные к покупке
  getProducts(): Observable<IProduct[]> {
    console.log('Start get products');
    return this._http.get(this.url, { responseType: 'text' }).pipe(
      map((res: any) => {
        let gsDataJSON = JSON.parse(res.substring(47, res.length - 2));
        //console.log(gsDataJSON);
        return gsDataJSON.table.rows
          .map(function (row: any): IProduct {
            return new ProductClass({
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
              brandLine: row.c[ProductColumns.colBrandLine]
                ? row.c[ProductColumns.colBrandLine].v
                : '',
              brandSeries: row.c[ProductColumns.colBrandSeries]
                ? row.c[ProductColumns.colBrandSeries].v
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
              isNew: (row.c[ProductColumns.colIsNew] && row.c[ProductColumns.colIsNew].v === true)
                ? true
                : false,
              translit: transliterate(
                row.c[ProductColumns.colName]
                  ? row.c[ProductColumns.colName].v
                  : '',
              ),
              detail: 
                row.c[ProductColumns.colDetail]
                  ? new ProductDetailClass(JSON.parse(row.c[ProductColumns.colDetail].v))
                  : new ProductDetailClass(null),
              isActive: (row.c[ProductColumns.colIsActive] && row.c[ProductColumns.colIsActive].v === true)
                ? true
                : false,
            });
          })
          .filter((p) => (p.price > 0 && p.isActive) || this.telegram.isAdmin);
      }),
      catchError(this.handleError<IProduct[]>('getProducts', [])),
    );
  }

  // get byGroup() {
  //   return this.$products().reduce((group, prod) => {
  //     if (!group[prod.type]) {
  //       group[prod.type] = [];
  //     }
  //     group[prod.type].push(prod);
  //     return group;
  //   }, {});
  // }

  // get byCategory() {
  //   return this.$products().reduce((group, prod) => {
  //     if (!group[prod.category]) {
  //       group[prod.category] = [];
  //     }
  //     group[prod.category].push(prod);
  //     return group;
  //   }, {});
  // }

  public sendProductToGoogleAppsScript(
    chat_id: string,
    userName: string,
    actionName: string,
    product: IProduct,
  ): Observable<any> {
    return this.telegram.sendToGoogleAppsScript({
      chat_id: chat_id,
      userName: userName,
      action: actionName,
      product: product,
    });
  }

  public downloadImage(fileName, url: string) {

    this._http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        // Create a link element
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName+'.png'; // Set the download filename
  
        // Append link to the body, click it, and then remove it
        // document.body.appendChild(link);
        link.click();
        // document.body.removeChild(link);
      },
      error: (err) => {
          console.error('Error downloading the image: ', err);
      },
      complete: () => {
        console.log('Download image complete');
      },
  });
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
