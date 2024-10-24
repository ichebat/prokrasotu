import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShopComponent } from './pages/shop/shop.component';
import { FeedbackComponent } from './pages/feedback/feedback.component';
import { ProductComponent } from './pages/product/product.component';
import { PagenotfoundComponent } from './pages/pagenotfound/pagenotfound.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderComponent } from './pages/order/order.component';
import { PrivacyComponent } from './pages/company/privacy/privacy.component';
import { ContactsComponent } from './pages/company/contacts/contacts.component';
import { AboutComponent } from './pages/company/about/about.component';
import { AgreementComponent } from './pages/company/privacy/agreement/agreement.component';
import { DeliveryComponent } from './pages/delivery/delivery.component';
import { DeliveryEditComponent } from './pages/delivery/delivery-edit/delivery-edit.component';

const routes: Routes = [
  { path: '', component: ShopComponent },
  { path: 'feedback', component: FeedbackComponent },
  { path: 'cart', component: CartComponent },
  
  { path: 'company/contacts', component: ContactsComponent },
  { path: 'company/about', component: AboutComponent },
  { path: 'company/privacy', component: PrivacyComponent },
  { path: 'company/privacy/agreement', component: AgreementComponent },

  { path: 'shop', component: ShopComponent },
  { path: 'shop/:category', component: ShopComponent },
  { path: 'shop/:category/:type', component: ShopComponent },
  { path: 'shop/:category/:type/:brand', component: ShopComponent },
  { path: 'shop/:category/:type/:brand/:brandLine', component: ShopComponent },
  { path: 'shop/:category/:type/:brand/:brandLine/:brandSeries', component: ShopComponent },
  { path: 'product', component: ProductComponent },
  { path: 'product/:id', component: ProductComponent },
  { path: 'product/:id/:productName', component: ProductComponent },
  { path: 'product/:id/:productName/:action', component: ProductComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'order', component: OrderComponent },
  { path: 'order/:id', component: OrderComponent },
  { path: 'order/:id/:action', component: OrderComponent },
  { path: 'delivery', component: DeliveryComponent },
  { path: 'delivery/:id/:action', component: DeliveryEditComponent },

  //Wild Card Route for 404 request
  { path: '**', pathMatch: 'full', component: PagenotfoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
      bindToComponentInputs: true,
      //useHash: true, //ошибка 404 на github pages пока не добавил хеши
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
