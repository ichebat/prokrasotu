import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ShopComponent } from './pages/shop/shop.component';
import { FeedbackComponent } from './pages/feedback/feedback.component';
import { ProductComponent } from './pages/product/product.component';
import { PagenotfoundComponent } from './pages/pagenotfound/pagenotfound.component';
import { TelegramService } from './services/telegram.service';
import { ProductListComponent } from './components/product-list/product-list.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MaterialModule } from './material.module';
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
import { BreadCrumbComponent } from './components/bread-crumb/bread-crumb.component';
import { CartComponent } from './pages/cart/cart.component';
import { CartItemComponent } from './components/cart-item/cart-item.component';
import { OrderComponent } from './pages/order/order.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderListComponent } from './components/order-list/order-list.component';
import { OrderIconComponent } from './components/order-icon/order-icon.component';
import { OrderItemComponent } from './components/order-item/order-item.component';
import { ConfirmDialogDemoComponent } from './components/confirm-dialog-demo/confirm-dialog-demo.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { PrivacyComponent } from './pages/company/privacy/privacy.component';
import { ProductSearchComponent } from './components/product-search/product-search.component';
import { ContactsListComponent } from './components/contacts-list/contacts-list.component';
import { ShareButtonDirective } from 'ngx-sharebuttons';
import { ShareButtonsComponent } from './components/share-buttons/share-buttons.component';
import { ContactsComponent } from './pages/company/contacts/contacts.component';
import { QRCodeModule } from 'angularx-qrcode';

import { BrandLineListComponent } from './components/brand-line-list/brand-line-list.component';
import { BrandSeriesListComponent } from './components/brand-series-list/brand-series-list.component';
import { AboutComponent } from './pages/company/about/about.component';
import { ImageCropperLoaderComponent } from './components/image-cropper-loader/image-cropper-loader.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { AgreementComponent } from './pages/company/privacy/agreement/agreement.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

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
    TypeListComponent,
    BreadCrumbComponent,
    CartComponent,
    CartItemComponent,
    OrderComponent,
    OrdersComponent,
    OrderListComponent,
    OrderIconComponent,
    OrderItemComponent,
    ConfirmDialogDemoComponent,
    PrivacyComponent,
    ProductSearchComponent,
    ContactsListComponent,
    ShareButtonsComponent,
    ContactsComponent,
    BrandSeriesListComponent,
    BrandLineListComponent,
    AboutComponent,
    ProductDetailComponent,
    AgreementComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    NgxMaskDirective,
    NgxMaskPipe,
    ShareButtonDirective,
    QRCodeModule,
    ImageCropperLoaderComponent,
    NgxMatSelectSearchModule
  ],
  providers: [
    TelegramService,
    provideAnimationsAsync(),
    [
      {
        provide: HTTP_INTERCEPTORS,
        useClass: CustomHttpInterceptor,
        multi: true,
      },
    ],
    provideNgxMask(),
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
