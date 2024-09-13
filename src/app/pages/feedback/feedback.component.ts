import { Component, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { TelegramService } from '../../services/telegram.service';
import { NavigationService } from '../../services/navigation.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
})
export class FeedbackComponent implements OnInit, OnDestroy {
  feedback = signal('');

  isUserAgreePersonalData: boolean = false; //для галочки с ПД
  isMainButtonHidden = true; //иногда, когда открывается диалог, необходимо скрыть MainButton телеграма, чтобы он не закрывал экран, а после диалога вернуть как было
  disableButton: boolean = false; //отключает кнопки на время отправки данных

  form: FormGroup = new FormGroup({}); //реактивная форма
 

  /**
   *
   */
  constructor(
    public telegramService: TelegramService,
    private navigation: NavigationService,
    private fb: FormBuilder,
    private router: Router,) {
    //при передаче параметра this теряется, поэтому забандить его в конструкторе
    this.sendData = this.sendData.bind(this);
    this.goBack = this.goBack.bind(this);

    const sendDataToTelegram = () => {
        this.sendData();
    };

    //привязка идет эффектом
    effect(() => {
      this.telegramService.tg.onEvent('mainButtonClicked', sendDataToTelegram);
      return () => {
        this.telegramService.tg.offEvent(
          'mainButtonClicked',
          sendDataToTelegram,
        );
      };
    });

    this.form = fb.group({
      clientPhone: [
        "",
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      clientName: [
        this.telegramService.FIO,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern('[A-Za-zА-Яа-я0-9-_ ]{2,50}'),
        ],
      ],
      feedbackMessage: [
        "",
        [Validators.required, Validators.maxLength(500)],
      ],
      isAgeePersonalData: [
        [Validators.requiredTrue],
      ],
    });

  }

  ngOnInit(): void {
    if (this.telegramService.IsTelegramWebAppOpened){      
      this.telegramService.BackButton.show();
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе

      this.telegramService.MainButton.setText('Отправить сообщение в PROКРАСОТУ');
    }


    this.setInitialValue();

    //подписываемся на изменения формы, для скрытия/отображения MainButton
    this.form.statusChanges.pipe(distinctUntilChanged()).subscribe(() => {
      console.log(this.form.status);
      this.isFormValid();
    });
    this.form.updateValueAndValidity(); //обновляем статус формы

    this.onHandleUpdate();

  }

  //проверка валидности и скрытие/отображение главной кнопки
  private isFormValid() {
    if (this.form.valid) {
      // this.telegramService.MainButton.show();
      // this.isMainButtonHidden = false;
      this.telegramService.MainButton.enable();
    } else {
      // this.telegramService.MainButton.hide();
      // this.isMainButtonHidden = true;
      this.telegramService.MainButton.disable();
    }
  }

  setInitialValue() {
    this.form.controls['clientName'].setValue(this.telegramService.FIO);
    this.form.controls['clientPhone'].setValue("");
    this.form.controls['feedbackMessage'].setValue("");
    this.form.controls['isAgeePersonalData'].setValue(false);
  }

  sendData() {
    if (this.form.valid) 
    {
    //this.telegramService.sendData({ feedback: this.feedback() });
      this.disableButton = true;
      this.telegramService.MainButton.setText('Отправка...');
      this.telegramService.MainButton.disable();

      this.telegramService.sendToGoogleAppsScript(
        {
          chat_id: this.telegramService.Id,
          userName: this.telegramService.UserName,
          clientName: this.form.controls['clientName'].value,
          clientPhone: this.form.controls['clientPhone'].value,
          feedbackMessage: this.form.controls['feedbackMessage'].value,
          action: "feedback",
        }
      ).subscribe({
        next: (data) => {
          const addOrder_response = data;
          console.log('feedback data', data);
        },
        error: (err) => {
          this.onHandleUpdate();
          console.log('feedback error', err);
        },
        complete: () => {
          this.onHandleUpdate();
          console.log('feedback complete');
          this.router.navigate(['/']);
          if (this.telegramService.IsTelegramWebAppOpened)
            this.telegramService.tg.close();
        },
      });
    }
  }

  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened){      
      this.telegramService.BackButton.hide();
      this.telegramService.BackButton.offClick(this.goBack);

      this.telegramService.MainButton.hide();
      this.telegramService.MainButton.disable();
    }
    
    this.isMainButtonHidden = true;
  }

  //вызывается по окончании обновления
  onHandleUpdate() {
    this.disableButton = false;
    this.telegramService.MainButton.enable();
    this.telegramService.MainButton.setText('Отправить сообщение в PROКРАСОТУ');
  }

  goBack() {
    if (
      this.telegramService.IsTelegramWebAppOpened && !this.navigation.isHistoryAvailable)
    {
      console.log('Закрываем Tg');
      this.telegramService.tg.close();
    }

    this.navigation.back();
    
  }

  onClientPhoneClear() {
    if (!this.form.controls['clientPhone'].disabled) {
      this.form.controls['clientPhone'].setValue("");
    }
  }
  onFeedbackMessageClear() {
    if (!this.form.controls['feedbackMessage'].disabled) {
      this.form.controls['feedbackMessage'].setValue("");
    }
  }
  onClientNameClear() {
    if (!this.form.controls['clientName'].disabled) {
      this.form.controls['clientName'].setValue("");
    }
  }
}
