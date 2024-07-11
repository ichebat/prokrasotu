import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-imgx',
  templateUrl: './imgx.component.html',
  styleUrl: './imgx.component.scss',
})
export class ImgxComponent {
  @Input() title!: string;

  constructor() {}
}
