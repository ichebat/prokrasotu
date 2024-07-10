import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  public visibility: BehaviorSubject<boolean> = new BehaviorSubject(false);
  count = 0;

  constructor() {
    this.visibility = new BehaviorSubject(false);
  }

  show() {
    //this.visibility.next(true);
    setTimeout(() => {
      this.visibility.next(true);
      // this.count++;
    }, 1);
  }

  hide() {
    setTimeout(() => {
      // this.count--;
      // if (this.count ===0) 
      this.visibility.next(false);
    }, 1);
    //this.visibility.next(false);
  }
}
