import { Component, Input } from '@angular/core';
import { IProductType } from '../../services/products.service';

@Component({
  selector: 'app-type-icon',
  templateUrl: './type-icon.component.html',
  styleUrl: './type-icon.component.scss'
})
export class TypeIconComponent {
  @Input() type!: IProductType;

}
