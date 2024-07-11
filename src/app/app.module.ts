import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ShopComponent } from './pages/shop/shop.component';
import { FeedbackComponent } from './pages/feedback/feedback.component';
import { ProductComponent } from './pages/product/product.component';
import { PagenotfoundComponent } from './pages/pagenotfound/pagenotfound.component';
import { TelegramService } from './services/telegram.service';
import { ProductListComponent } from './components/product-list/product-list.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MaterialModule } from './material.module'
import { CustomHttpInterceptor } from './http-interceptor';
import { ProductItemComponent } from './components/product-item/product-item.component';
import { ProductIconComponent } from './components/product-icon/product-icon.component';
import { ImgxComponent } from './components/imgx/imgx.component';


@NgModule({
  declarations: [
    AppComponent,
    ShopComponent,
    FeedbackComponent,
    ProductComponent,
    PagenotfoundComponent,
    ProductListComponent,
    ProductItemComponent,
    ProductIconComponent,
    ImgxComponent
  ],
  imports: [
    MaterialModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [
    TelegramService, 
    provideAnimationsAsync(),
    [{
      provide: HTTP_INTERCEPTORS,
      useClass: CustomHttpInterceptor,
      multi: true
    }]
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
