import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, NgZone, OnInit, Output, signal } from '@angular/core';
import { IProduct, ProductAttributeClass, ProductClass, ProductDetailClass } from '../../services/products.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';

export interface DialogData {  
  message: string;
  description: string;
  product: ProductClass;
}

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  @Input() product!: ProductClass;
  @Output() public onDetailChanged: EventEmitter<any> = new EventEmitter<any>();

  step = signal(-1);

  form: FormGroup = new FormGroup({}); //реактивная форма

  dataSource: MatTableDataSource<any> = new MatTableDataSource([] as any[]);;
  displayedColumns: string[] = []; //список колонок для отображения

  myDateNumber: number = new Date().getTime();

  isProductDetailExist: boolean = false; //имеются ли в карточке детали (подкарточки)

  //когда нажимаем отправку кнопки становятся неактивными
  disableButton: boolean = false; //отключает кнопки на время отправки данных

  constructor(
    private fb: FormBuilder,
    private zone: NgZone,
    public dialog: MatDialog,
  ) {

    this.buildForm();
    this.updateDataSource();
  }

  ngOnInit(): void {
    this.setInitialValue();
  }

  //после конструктора необходимо заполнить форму начальными значениями
  setInitialValue() {

    this.form.controls['mainImageUrl'].setValue(this.product.detail.mainImageUrl);
    this.form.controls['mainImageDescription'].setValue(this.product.detail.mainImageDescription);

    this.product.detail.keys.forEach(colName=>{
      this.displayedColumns.push(colName);
      this.keys.push(this.newKey(colName));
    });
    
    this.product.detail.attributes.forEach(attribute => {
      var ctrl = this.newAttribute();
      ctrl.get('imageUrl')?.setValue(attribute.imageUrl);
      ctrl.get('description')?.setValue(attribute.description);
      ctrl.get('price')?.setValue(attribute.price);
      ctrl.get('isActive')?.setValue(attribute.isActive);
      for (let index = 0; index < attribute.keyValues.length; index++) {
        (ctrl.get('keyValues') as FormArray).controls[index].get('keyValue')?.setValue(attribute.keyValues[index]);     
      }
      this.attributes.push(ctrl);      
    });

    if (this.product && this.product.detail && (this.product.detail.mainImageDescription || this.product.detail.mainImageUrl || this.product.detail.keys.length>0 || this.product.detail.attributes.length>0)) {
      this.isProductDetailExist = true;
      this.form.controls['isProductDetailExist'].setValue(true);
    }


    
    this.updateDataSource();

  }

  buildForm() {
    this.form = this.fb.group({
      mainImageUrl: ['',[
        Validators.minLength(2),
        Validators.maxLength(255),
        Validators.pattern(
          '^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$',
        ),
      ]],
      mainImageDescription: ['',[
              Validators.maxLength(500)
            ]],
      keys: this.fb.array([]),
      attributes: this.fb.array([]),

      isProductDetailExist: [
        this.isProductDetailExist,
        [
          //Validators.requiredTrue,
        ],
      ],
    });
  }

  newKey(newkey): FormGroup {
    return this.fb.group({
      key: [newkey,[
              Validators.required,
              Validators.minLength(2),
              Validators.maxLength(50),
            ]],
    })
 }

 newKeyValue(newvalue): FormGroup {
  return this.fb.group({
    keyValue: [newvalue,[
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ]],
  })
}

 

 newAttribute(): FormGroup {
  var att = this.fb.group({
    imageUrl: ['',[
            Validators.minLength(2),
            Validators.maxLength(255),
            Validators.pattern(
              '^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$',
            ),
          ]],
    description: ['',[
            Validators.required, 
            Validators.maxLength(500)
          ]],
    price: [0,[Validators.required, Validators.min(0)]],    
    isActive: [false,[]],
    keyValues: this.fb.array([]),
  });

  this.displayedColumns.forEach(element => {
    (att.controls['keyValues']as FormArray).push(this.newKeyValue(''))
  });

  return att;
}

  get keys() {
    return this.form.get('keys') as FormArray;
  }

  get attributes() {
    return this.form.get('attributes') as FormArray;
  }

  get displayedColumnsForTable(){ //список колонок для отображения в таблице со всеми полями, не только динамическими keyValues
    var cols = [] as string[];

    //this.displayedColumns.forEach(p=>cols.push(p));
    cols.push('imageUrl');
    cols.push('description');
    cols.push('price');
    cols.push('isActive');
    cols.push('ActionBar');
    return cols;
  }

  keyValues(index) {
    return (this.attributes.controls[index]).get('keyValues') as FormArray;
  }

  //функция отправки данных
  sendData() {}

  updateDataSource(){
    this.dataSource =
      this.product && this.product.detail
        ? new MatTableDataSource(this.product.detail.attributes)
        : new MatTableDataSource([] as any[]); //для отображения таблицы
  }

  //функция добавить колонку
  addColumn() {
    const colName = 'Св-во ' + (this.product.detail.keys.length + 1).toString();

    this.displayedColumns.push(colName);
    this.keys.push(this.newKey(colName));
    this.product.detail.keys.push(colName);
    
    this.updateDataSource();

    this.keys.updateValueAndValidity();

    //console.log(this.keys.value);
    
  }

  //функция удалить колонку
  removeColumn() {
    const index = this.product.detail.keys.length-1;
    if (index>=0)
    {
      this.displayedColumns.splice(index,1);
      this.keys.removeAt(index);
      this.product.detail.keys.splice(index,1);
      
      this.updateDataSource();

      this.keys.updateValueAndValidity();
      //this.form.updateValueAndValidity(); //обновляем статус формы
      //console.log(this.keys.value);
    }
    
  }


  //функция добавить строку
  addRow() {
    this.attributes.push(this.newAttribute());

    var t = new ProductAttributeClass(null);
    this.product.detail.keys.forEach(p=>{
      t.keyValues.push('');
    })
    
    this.product.detail.attributes.push(t);
    

    this.updateDataSource();

    this.keys.updateValueAndValidity();

    this.setStep(this.product.detail.attributes.length-1)
    //this.form.updateValueAndValidity(); //обновляем статус формы
    //console.log(this.attributes.value);
    
  }
  //функция удалить строку
  removeRow(index) {

    this.zone.run(() => {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: 'Удаление?',
            description:
              'Следующий товар: [' +
              this.product.name +' '+ this.product.detail.attributes[index].description+
              '] будет удален безвозвратно. Подтвердите действие.',
          },
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result == true) {
          
          this.attributes.removeAt(index);
          this.product.detail.attributes.splice(index,1);
          this.updateDataSource();
          this.keys.updateValueAndValidity();
        }
      });
    });

    
    //const index = this.product.detail.attributes.length-1;

   
    //this.form.updateValueAndValidity(); //обновляем статус формы
    //console.log(this.attributes.value);
  }

  onImageUrlClear(index) {
    this.product.detail.attributes[index].imageUrl = '';
    this.attributes.controls[index].get('imageUrl')?.setValue('');
  }
  imageUrlChanging(event, index) {
    const value = event;    
    this.product.detail.attributes[index].imageUrl = value;
  }

  onMainImageUrlClear() {
    this.product.detail.mainImageUrl = '';
    this.form.get('mainImageUrl')?.setValue('');
  }
  mainImageUrlChanging(event) {
    const value = event;    
    this.product.detail.mainImageUrl = value;
  }
  onMainImageDescriptionClear() {
    this.product.detail.mainImageDescription = '';
    this.form.get('mainImageDescription')?.setValue('');
  }
  mainImageDescriptionChanging(event) {
    const value = event;    
    this.product.detail.mainImageDescription = value;
  }
  onDescriptionClear(index) {
    if (index>=0 && !this.attributes.controls[index].disabled){  
      this.product.detail.attributes[index].description = '';
      (this.attributes.controls[index]).get('description')?.setValue('');
    }
  }
  descriptionChanging(event, index) {
    const value = event;    
    this.product.detail.attributes[index].description = value;
  }
  onPriceClear(index) {
    if (index>=0 && !this.attributes.controls[index].disabled){  
      this.product.detail.attributes[index].description = '';
      (this.attributes.controls[index]).get('price')?.setValue(0);
    }
  }
  priceChanging(event, index) {
    const value = event;    
    this.product.detail.attributes[index].price = value;
  }
  isActiveCheckBoxChanging(event, index) {
    const value = event.checked as boolean;
    //console.log(value);
    this.product.detail.attributes[index].isActive = value;
  }

  onKeyClear(index) {
    if (index>=0 && !this.keys.controls[index].disabled){   
      this.displayedColumns[index] = 'Св-во ' + (index+1);
      this.product.detail.keys[index] = 'Св-во ' + (index+1);
      this.keys.controls[index] = this.newKey('');
    }
    this.keys.updateValueAndValidity();
  }
  detailKeyChanging(event, index) {
    const value = event;
    if (index>=0) {
      if (!value || this.product.detail.keys.indexOf(value)>=0) {        
        this.displayedColumns[index] = 'Св-во ' + (index+1);
        this.product.detail.keys[index] = 'Св-во ' + (index+1);
        if (value) this.keys.controls[index] = this.newKey('Св-во ' + (index+1));
      }
      else {              
          this.displayedColumns[index] = value;
          this.product.detail.keys[index] = value;
      }

      this.keys.updateValueAndValidity();
    }
  }

  onKeyValueClear(i,j) {
    this.product.detail.attributes[i].keyValues[j] = '';
    ((this.attributes.controls[i]).get('keyValues') as FormArray).controls[j].get('keyValue')?.setValue('');    
  }
  detailKeyValueChanging(event, i,j) {
     const value = event; 
     this.product.detail.attributes[i].keyValues[j] = value;
     (this.attributes.controls[i]).get('description')?.setValue(this.product.detail.attributes[i].keyValues.join(' '));

  }

  public GitHubLoading(event: boolean):void {
    //console.log('GitHubLoading',event)
    this.disableButton = event;
  } 
  public GitHubLoaded(event: any):void {
    //console.log('Loaded GitHub: ', event);
    const newImageUrl = event.content.download_url;
    if (!this.form.controls['mainImageUrl'].disabled && newImageUrl) {
      this.product.detail.mainImageUrl = newImageUrl;
      this.form.controls['mainImageUrl'].setValue(this.product.detail.mainImageUrl);
    }
    
  } 

  public GitHubDetailLoading(event: boolean):void {
    //console.log('GitHubLoading',event)
    this.disableButton = event;
  } 
  public GitHubDetailLoaded(event: any, index):void {
    //console.log('Loaded GitHub: ', event);
    const newImageUrl = event.content.download_url;
    if (!this.attributes.controls[index].disabled && newImageUrl) {
      this.product.detail.attributes[index].imageUrl = newImageUrl;
      (this.attributes.controls[index]).get('imageUrl')?.setValue(newImageUrl);
    }
    
  } 

  getPercentFillGoogleSheetCell()
  {
    const val = JSON.stringify(this.product.detail).length/50000;
    
    return val;
  }

  setStep(index: number) {
    this.step.set(index);
  }

}
