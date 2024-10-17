import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TelegramService } from '../../../services/telegram.service';
import { NavigationService } from '../../../services/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';

@Component({
  selector: 'app-delivery-edit',
  templateUrl: './delivery-edit.component.html',
  styleUrl: './delivery-edit.component.scss'
})
export class DeliveryEditComponent implements OnInit, OnDestroy, AfterViewInit{

  @Input() set action(action: string) {
    //console.log('action: ' + action);
    if(action)this.deliveryService.$action.set(action);
    else
    this.deliveryService.$action.set('');
  }
  /**
   *
   */
  constructor(
    public deliveryService: DeliveryService,
    private telegramService: TelegramService,
    private navigation: NavigationService,
    private route: ActivatedRoute,) {

      const id = this.route.snapshot.paramMap.get('id');
      this.deliveryService.updateId(id);

      this.goBack = this.goBack.bind(this);
    
  }

  ngAfterViewInit(): void {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  ngOnDestroy(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.hide();
      this.telegramService.BackButton.offClick(this.goBack);
    }
  }

  goBack() {
    //this.location.back();
    this.navigation.back();
  }

  ngOnInit(): void {
    if (this.telegramService.IsTelegramWebAppOpened) {
      this.telegramService.BackButton.show();
      this.telegramService.BackButton.onClick(this.goBack); //при передаче параметра this теряется, поэтому забандить его в конструкторе
    }
  }

}
