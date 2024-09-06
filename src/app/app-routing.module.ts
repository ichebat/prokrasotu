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
import { ContactsMarketComponent } from './pages/contacts-market/contacts-market.component';

const routes: Routes = [
  { path: '', component: ShopComponent },
  { path: 'feedback', component: FeedbackComponent },
  { path: 'cart', component: CartComponent },
  { path: 'contacts', component: ContactsMarketComponent },

  { path: 'shop', component: ShopComponent },
  { path: 'shop/:category', component: ShopComponent },
  { path: 'shop/:category/:type', component: ShopComponent },
  { path: 'shop/:category/:type/:brand', component: ShopComponent },
  { path: 'product/:id', component: ProductComponent },
  { path: 'product/:id/:product-name', component: ProductComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'order', component: OrderComponent },
  { path: 'order/:id', component: OrderComponent },
  { path: 'order/:id/:action', component: OrderComponent },

  { path: 'company/privacy', component: PrivacyComponent },

  //Wild Card Route for 404 request
  { path: '**', pathMatch: 'full', component: PagenotfoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      bindToComponentInputs: true,
      //useHash: true, //ошибка 404 на github pages пока не добавил хеши
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
