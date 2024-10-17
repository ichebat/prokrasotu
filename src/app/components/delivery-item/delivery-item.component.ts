import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DeliveryClass, DeliveryService } from '../../services/delivery.service';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TelegramService } from '../../services/telegram.service';
import { ConfirmDialogDemoComponent } from '../confirm-dialog-demo/confirm-dialog-demo.component';

@Component({
  selector: 'app-delivery-item',
  templateUrl: './delivery-item.component.html',
  styleUrl: './delivery-item.component.scss'
})
export class DeliveryItemComponent implements OnInit, OnDestroy{
  @Input() delivery!: DeliveryClass;
  @Input() action: string = ''; //действие по которому строится контрол (view, edit)

  form: FormGroup = new FormGroup({}); //реактивная форма

  private subscr_form: Subscription = Subscription.EMPTY;

  owner = environment.owner;

  MainButtonText = ''; //в зависимости от того какой режим разные надписи на главной кнопке телеграма

  mainButtonTextValid = 'Отправить в ' + this.owner.marketName;
  mainButtonTextProgress = 'Отправка...';
  mainButtonTextInvalid = 'Некорректно заполнены поля';

  FormControlsFlags: any = [
    { controlName: 'id', visible: true, enabled: true },
    { controlName: 'name', visible: true, enabled: true },
    { controlName: 'description', visible: true, enabled: true },
    { controlName: 'amount', visible: true, enabled: true },
    { controlName: 'freeAmount', visible: true, enabled: true },
    { controlName: 'isActive', visible: true, enabled: true },
    { controlName: 'isAddressRequired', visible: true, enabled: true },
    { controlName: 'dadataFilter', visible: true, enabled: true },
    { controlName: 'clientMessage', visible: true, enabled: true },

    { controlName: 'button_submit', visible: true, enabled: true },
  ];

   //когда нажимаем отправку кнопки становятся неактивными
   disableButton: boolean = false; //отключает кнопки на время отправки данных

  /**
   *
   */
  constructor(public deliveryService: DeliveryService,
    public telegramService: TelegramService,
    public dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder,
    private zone: NgZone,
  ) {
    this.sendData = this.sendData.bind(this); //функция для главной MainButton кнопки телеграм

    //строим реактивную форму с валидацией
    this.form = fb.group({
      id: [this.delivery?.id, [Validators.required]],
      name: [
        this.delivery?.name,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
          Validators.pattern('[A-Za-zА-ЯЁа-яё0-9-:()!/,/._% ]{2,100}'),
        ],
      ],
      description: [
        this.delivery?.description,
        [Validators.required, Validators.maxLength(5000)],
      ],
      amount: [this.delivery?.amount, [Validators.required, Validators.min(0)]],
      freeAmount: [this.delivery?.freeAmount, [Validators.required, Validators.min(0)]],
      isActive: [this.delivery?.isActive, []],
      isAddressRequired: [this.delivery?.isAddressRequired, []],
      dadataFilter: [
        this.delivery?.dadataFilter,
        [Validators.maxLength(100)],
      ],
      clientMessage: [
        this.delivery?.clientMessage,
        [Validators.required, Validators.maxLength(5000)],
      ],
    });

    
    
  }

  ngOnInit(): void {
    if (this.delivery && this.delivery.id == 0){
      this.delivery.id = this.deliveryService.$maxId()+1;
      this.action = 'edit';
      console.log('new id of delivery: '+this.delivery.id);
    }

    if (this.telegramService.IsTelegramWebAppOpened) {
      // this.telegramService.BackButton.show();
      // this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
      if (this.telegramService.isAdmin && this.action == 'edit') {
        this.telegramService.MainButton.show();
        this.telegramService.MainButton.enable();
        this.telegramService.MainButton.onClick(this.sendData);
        this.telegramService.MainButton.setText(this.mainButtonTextValid);
      } else this.telegramService.MainButton.hide();
    }

    this.setInitialValue();

    this.form.updateValueAndValidity(); //обновляем статус формы

    this.onHandleUpdate();

  }

  //после конструктора необходимо заполнить форму начальными значениями
  setInitialValue() {
    //выставляем флаги отображения контролов
    this.FormControlsFlags.forEach((item) => {
      //1. ******************************************* */
      //если создается новый способ доставки не через телеграм бота (через сайт)
      if (
        !this.telegramService.IsTelegramWebAppOpened &&
        this.delivery?.id == 0
      ) {
        //отображение следующих контролов будет изменено
        item.visible = false;

        //возможность редактирования следующих контролов будет изменена
        item.enabled = false;        
      }

      //2. ******************************************* */
      //если создается новый способ доставки ЧЕРЕЗ телеграм бота (НЕ через сайт)
      else if (
        this.telegramService.IsTelegramWebAppOpened &&
        this.telegramService.isAdmin &&
        this.delivery?.id == 0
      ) {
        //отображение следующих контролов будет изменено
        item.visible = true;

        //возможность редактирования следующих контролов будет изменена
        item.enabled = true;
      }

      //3. ******************************************* */
      //если способ доставки редактируется ЧЕРЕЗ телеграм бота (НЕ через сайт)
      else if (
        this.telegramService.IsTelegramWebAppOpened &&
        this.telegramService.isAdmin &&
        this.delivery?.id > 0
      ) {
        //отображение следующих контролов будет изменено
        item.visible = true;

        //возможность редактирования следующих контролов будет изменена
        item.enabled = true;
      }

      //4. ******************************************* */
      //если способ доставки редактируется не через телеграм бота (через сайт)
      else if (
        !this.telegramService.IsTelegramWebAppOpened &&
        this.delivery?.id > 0
      ) {
        //такое запрещено, все скрываем и не редактируем
        item.visible = false;
        item.enabled = false;
      }
      //КОНЕЦ. ******************************************* */

      //выключаем контролы
      if (!item.controlName.toString().startsWith('button_')) {
        if (!item.enabled && this.form.controls[item.controlName])
          this.form.controls[item.controlName].disable();        
      }
    });

    if (!this.telegramService.isAdmin) return;

    this.form.controls['id'].setValue(this.delivery?.id);
    this.form.controls['name'].setValue(this.delivery?.name);
    this.form.controls['description'].setValue(this.delivery?.description), 
    this.form.controls['amount'].setValue(this.delivery?.amount);
    this.form.controls['freeAmount'].setValue(this.delivery?.freeAmount);
    this.form.controls['isActive'].setValue(this.delivery?.isActive);
    this.form.controls['isAddressRequired'].setValue(this.delivery?.isAddressRequired);
    this.form.controls['dadataFilter'].setValue(this.delivery?.dadataFilter);
    this.form.controls['clientMessage'].setValue(this.delivery?.clientMessage);
  }

   //отвязываем кнопки
   ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      // this.telegramService.BackButton.hide();
      // this.telegramService.BackButton.offClick(this.goBack);

      if (this.telegramService.isAdmin) {
        this.telegramService.MainButton.hide();
        this.telegramService.MainButton.offClick(this.sendData);
      }
    }

    this.subscr_form.unsubscribe();
  }

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

    console.log(this.form.controls['isActive'].value);

    if (
      this.delivery.id > 0 &&
      this.telegramService.isAdmin &&
      method == 'remove'
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText(this.mainButtonTextProgress);
      this.telegramService.MainButton.disable();

      this.deliveryService
        .sendDeliveryToGoogleAppsScript(
          this.telegramService.Id,
          this.telegramService.UserName,
          'removeDelivery',
          {
            id: this.delivery?.id,
            name: this.form.controls['name'].value,
            description: this.form.controls['description'].value,
            amount: this.form.controls['amount'].value,
            freeAmount: this.form.controls['freeAmount'].value,
            isActive: this.form.controls['isActive'].value,
            isAddressRequired: this.form.controls['isAddressRequired'].value,
            dadataFilter: this.form.controls['dadataFilter'].value,
            clientMessage: this.form.controls['clientMessage'].value,
          },
        )
        .subscribe({
          next: (data) => {
            const removeDeivery_response = data;
            console.log('removeDeivery data', data);
          },
          error: (err) => {
            this.onHandleUpdate();
            console.log('removeDeivery error', err);
          },
          complete: () => {

            this.onHandleUpdate();
            console.log('removeDeivery complete');
            this.router.navigate(['/']);
            this.deliveryService.updateDeliveryApi();
          },
        });
    }

    //добавление нового товара делается кнопкой submit

    if (
      (this.delivery.id == 0 || this.delivery.id == this.deliveryService.$maxId()+1) &&
      this.getVisible('button_submit') &&
      this.getEnabled('button_submit') &&
      this.form.valid &&
      this.telegramService.isAdmin &&
      method == 'update'
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText(this.mainButtonTextProgress);
      this.telegramService.MainButton.disable();

      this.deliveryService
        .sendDeliveryToGoogleAppsScript(
          this.telegramService.Id,
          this.telegramService.UserName,
          'addDelivery',
          {
            id: 0,
            name: this.form.controls['name'].value,
            description: this.form.controls['description'].value,
            amount: this.form.controls['amount'].value,
            freeAmount: this.form.controls['freeAmount'].value,
            isActive: this.form.controls['isActive'].value,
            isAddressRequired: this.form.controls['isAddressRequired'].value,
            dadataFilter: this.form.controls['dadataFilter'].value,
            clientMessage: this.form.controls['clientMessage'].value,
          },
        )
        .subscribe({
          next: (data) => {
            const addDelivery_response = data;
            console.log('addDelivery data', data);
          },
          error: (err) => {
            this.onHandleUpdate();
            console.log('addDelivery error', err);
          },
          complete: () => {
            this.onHandleUpdate();
            console.log('addDelivery complete');
            this.router.navigate(['/']);
            this.deliveryService.updateDeliveryApi();
          },
        });
    }

    if (
      (this.delivery.id > 0 && this.delivery.id != this.deliveryService.$maxId()+1) &&
      this.getVisible('button_submit') &&
      this.getEnabled('button_submit') &&
      this.form.valid &&
      this.telegramService.isAdmin &&
      method == 'update'
    ) {
      this.disableButton = true;
      this.telegramService.MainButton.setText(this.mainButtonTextProgress);
      this.telegramService.MainButton.disable();

      this.deliveryService
        .sendDeliveryToGoogleAppsScript(
          this.telegramService.Id,
          this.telegramService.UserName,
          'updateDelivery',
          {
            id: this.delivery?.id,
            name: this.form.controls['name'].value,
            description: this.form.controls['description'].value,
            amount: this.form.controls['amount'].value,
            freeAmount: this.form.controls['freeAmount'].value,
            isActive: this.form.controls['isActive'].value,
            isAddressRequired: this.form.controls['isAddressRequired'].value,
            dadataFilter: this.form.controls['dadataFilter'].value,
            clientMessage: this.form.controls['clientMessage'].value,
          },
        )
        .subscribe({
          next: (data) => {
            const updateDelivery_response = data;
            console.log('updateDelivery data', data);
          },
          error: (err) => {
            this.onHandleUpdate();
            console.log('updateDelivery error', err);
          },
          complete: () => {
            this.onHandleUpdate();
            console.log('updateDelivery complete');
            this.router.navigate(['/']);
            this.deliveryService.updateDeliveryApi();
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

  //вызывается по окончании обновления
  onHandleUpdate() {
    this.disableButton = false;
    this.telegramService.MainButton.enable();
    if (this.getVisible('button_submit') && this.getEnabled('button_submit')) {
      this.telegramService.MainButton.setText(this.mainButtonTextValid);
    }
  }

  onNameClear() {
    if (!this.form.controls['name'].disabled) {
      //this.delivery.name = '';
      //this.form.controls['name'].setValue(this.delivery.name);
      this.form.controls['name'].setValue('');
    }
  }
  onDescriptionClear() {
    if (!this.form.controls['description'].disabled) {
      //this.delivery.description = '';
      //this.form.controls['description'].setValue(this.delivery.description);
      this.form.controls['description'].setValue('');
    }
  }
  onAmountClear() {
    if (!this.form.controls['amount'].disabled) {
      //this.delivery.amount = 0;
      //this.form.controls['amount'].setValue(this.delivery.amount);
      this.form.controls['amount'].setValue(0);
    }
  }
  onFreeAmountClear() {
    if (!this.form.controls['freeAmount'].disabled) {
      //this.delivery.freeAmount = 0;
      //this.form.controls['freeAmount'].setValue(this.delivery.freeAmount);
      this.form.controls['freeAmount'].setValue(0);
    }
  }
  onDadataFilterClear() {
    if (!this.form.controls['dadataFilter'].disabled) {
      //this.delivery.dadataFilter = '';
      //this.form.controls['dadataFilter'].setValue(this.delivery.dadataFilter);
      this.form.controls['dadataFilter'].setValue('');
    }
  }
  onClientMessageClear() {
    if (!this.form.controls['clientMessage'].disabled) {
      //this.delivery.clientMessage = '';
      //this.form.controls['clientMessage'].setValue(this.delivery.clientMessage);
      this.form.controls['clientMessage'].setValue('');
    }
  }

  removeDelivery() {
    this.zone.run(() => {
      const dialogRef = this.dialog.open<ConfirmDialogDemoComponent>(
        ConfirmDialogDemoComponent,
        {
          data: {
            message: 'Удаление?',
            description:
              'Следующий способ доставки: [' +
              this.delivery.name +
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


}
