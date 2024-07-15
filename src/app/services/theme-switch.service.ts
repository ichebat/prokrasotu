import { Injectable, effect, signal } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeSwitchService {
  isDarkThemeActive: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(overlayContainer: OverlayContainer) { 

    if (this.isDarkThemeActive == null) 
    {
      
      var isDarkThemeActiveStorage = window.localStorage.getItem("isDarkThemeActive");
      
      if (isDarkThemeActiveStorage) {
        this.isDarkThemeActive = new BehaviorSubject(isDarkThemeActiveStorage == "true");
       
        this.OnThemeSwitch.next(isDarkThemeActiveStorage == "true");
        //overlayContainer.getContainerElement().classList.add('solution-dark-theme');
      }
      else
      {
      this.isDarkThemeActive = new BehaviorSubject(false);
      //overlayContainer.getContainerElement().classList.remove('solution-dark-theme');
      }
      
      
    }
    
      
    
    this.OnThemeSwitch.subscribe( value => {
      this.isDarkThemeActive.next(value);
      if(value)
      {
        overlayContainer.getContainerElement().classList.add('solution-dark-theme');
      }
      else
      {
        overlayContainer.getContainerElement().classList.remove('solution-dark-theme');
      }
    });
  }

  public OnThemeSwitch: Subject<boolean> = new Subject<boolean>();
}