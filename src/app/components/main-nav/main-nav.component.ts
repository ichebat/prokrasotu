import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { ThemeSwitchService } from '../../services/theme-switch.service';
import { ProductsService } from '../../services/products.service';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrl: './main-nav.component.scss',
})
export class MainNavComponent implements OnInit {
  @ViewChild(MatSidenav) sidenav!: MatSidenav;
  isMobile = true;
  isCollapsed = true;

  expandHeight = '42px';
  collapseHeight = '42px';

  step = signal(-1);

  constructor(
    private observer: BreakpointObserver,
    public readonly _themeSwitchService: ThemeSwitchService,
    public productsService: ProductsService,
    public cartService: CartService,
    private router: Router,
  ) {}
  ngOnInit(): void {
    this.observer.observe(['(max-width: 800px)']).subscribe((screenSize) => {
      if (screenSize.matches) {
        this.isMobile = true;
      } else {
        this.isMobile = false;
      }
    });
  }

  toggleMenu() {
    // if(this.isMobile){
    this.sidenav.toggle();
    this.isCollapsed = false; // On mobile, the menu can never be collapsed
    // } else {
    //   this.sidenav.open(); // On desktop/tablet, the menu can never be fully closed
    //   this.isCollapsed = !this.isCollapsed;
    // }

    this.setStep(-1);
  }

  onThemeChange(event) {
    // alert (event.checked)
    //this._themeSwitchService.OnThemeSwitch.next(event.checked);
    //this._themeSwitchService.OnThemeSwitch.next(event.checked);
    let isDark = !this._themeSwitchService.isDarkThemeActive.value;
    this._themeSwitchService.OnThemeSwitch.next(isDark);
    //window.localStorage.setItem("isDarkThemeActive", event.checked);
    window.localStorage.setItem('isDarkThemeActive', isDark.toString());
  }

  setStep(index: number) {
    this.step.set(index);
  }

  nextStep() {
    this.step.update((i) => i + 1);
  }

  prevStep() {
    this.step.update((i) => i - 1);
  }

  isProductView() {
    // return true if the current page is login
    console.log(this.router.url.match('^/product'));
    return this.router.url.match('^/product');
  }
}
