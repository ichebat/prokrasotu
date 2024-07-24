import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShopComponent } from './pages/shop/shop.component';
import { FeedbackComponent } from './pages/feedback/feedback.component';
import { ProductComponent } from './pages/product/product.component';
import { PagenotfoundComponent } from './pages/pagenotfound/pagenotfound.component';

const routes: Routes = [
  {path:'', component: ShopComponent},
  {path:'feedback', component: FeedbackComponent},
  
  {path:'shop/:category/:type/:brand', component: ShopComponent},  
  {path:'shop/:category/:type', component: ShopComponent},  
  {path:'shop/:category', component: ShopComponent},
  {path:'shop', component: ShopComponent},
  {path:'product/:id', component: ProductComponent},
  {path:'product/:id/:product-name', component: ProductComponent},

  //Wild Card Route for 404 request 
  { path: '**', pathMatch: 'full',  component: PagenotfoundComponent }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled', bindToComponentInputs: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
