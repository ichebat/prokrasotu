import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {  
  message: string;
  description: string;
  value: string;
  showinput: boolean;
  showCancelButton: boolean;
  inputvalues: string[];
  inputdescriptions: string[];
}

@Component({
  selector: 'app-confirm-dialog-demo',
  templateUrl: './confirm-dialog-demo.component.html',
  styleUrl: './confirm-dialog-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogDemoComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogDemoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

}
