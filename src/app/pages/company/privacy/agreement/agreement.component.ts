import {
  AfterViewInit,
  Component,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { TelegramService } from '../../../../services/telegram.service';
import { NavigationService } from '../../../../services/navigation.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface DialogData {
  isModal: boolean; //если открыть с isModal == true то BackButton не отключается
}

@Component({
  selector: 'app-agreement',
  templateUrl: './agreement.component.html',
  styleUrl: './agreement.component.scss',
})
export class AgreementComponent implements OnInit, OnDestroy, AfterViewInit {
  owner = environment.owner;
  data;

  constructor(
    public telegramService: TelegramService,
    private navigation: NavigationService,
    private injector: Injector,
    //  @Inject(MAT_DIALOG_DATA) public data: DialogData,
    //  public dialogRef: MatDialogRef<PrivacyComponent>,
  ) {
    this.data = this.injector.get(MAT_DIALOG_DATA, null);
    this.goBack = this.goBack.bind(this);
  }

  ngOnInit(): void {
    if (
      this.telegramService.IsTelegramWebAppOpened &&
      ((this.data && this.data.isModal == false) || !this.data)
    ) {
      this.telegramService.BackButton.show();
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
    }
  }

  ngOnDestroy(): void {
    if (
      this.telegramService.IsTelegramWebAppOpened &&
      ((this.data && this.data.isModal == false) || !this.data)
    ) {
      //this.telegramService.BackButton.hide();
      //this.telegramService.BackButton.offClick(this.goBack);
    }
  }

  goBack() {
    this.navigation.back();
  }

  ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }
}
