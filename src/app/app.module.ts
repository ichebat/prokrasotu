import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
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
import { MainNavComponent } from './components/main-nav/main-nav.component';
import { CategoryIconComponent } from './components/category-icon/category-icon.component';
import { TypeIconComponent } from './components/type-icon/type-icon.component';
import { BrandIconComponent } from './components/brand-icon/brand-icon.component';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { BrandListComponent } from './components/brand-list/brand-list.component';
import { TypeListComponent } from './components/type-list/type-list.component';


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
    MainNavComponent,
    CategoryIconComponent,
    TypeIconComponent,
    BrandIconComponent,
    CategoryListComponent,
    BrandListComponent,
    TypeListComponent
  ],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
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
