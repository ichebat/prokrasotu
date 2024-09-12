import { Component, Input } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-share-buttons',
  templateUrl: './share-buttons.component.html',
  styleUrl: './share-buttons.component.scss'
})
export class ShareButtonsComponent {
  @Input() url = 'Angular1';
  @Input() title = 'Angular2';
  @Input() description = 'Angular3';

  getUrlForTelegram(){
    //https://t.me/botusername/appname?startapp=someParamValue
    if (this.url) 

      //return environment.webAppDirectLink+"?startapp="+this.url.replaceAll('/','_'); //Эта ссылка пряма на бота, не выполнит команду /start
      return environment.webAppDirectLink+"?start="+this.url.replaceAll('/','_'); //эта гарантированно выполнит /start
    else 
      return environment.webAppDirectLink;
  }

}
