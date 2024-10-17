import { Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { DeliveryClass } from '../../services/delivery.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-delivery-list',
  templateUrl: './delivery-list.component.html',
  styleUrl: './delivery-list.component.scss'
})
export class DeliveryListComponent implements OnInit {
  @Input() titleList = 'Angular';
  @Input() subtitleList = 'Angular';
  @Input() deliveryList: DeliveryClass[] = [];

  dataSource: MatTableDataSource<any> = new MatTableDataSource([] as any[]);
  displayedColumns: string[] = ['description', 'ActionBar']; //список колонок для отображения

  /**
   *
   */
  constructor(public telegramService: TelegramService,
    public dialog: MatDialog,
    
  ) {
    this.updateDataSource();
    
  }
  ngOnInit(): void {
    this.updateDataSource();
  }

  updateDataSource(){
    this.dataSource =
      this.deliveryList
        ? new MatTableDataSource(this.deliveryList)
        : new MatTableDataSource([] as any[]); //для отображения таблицы
  }

}
