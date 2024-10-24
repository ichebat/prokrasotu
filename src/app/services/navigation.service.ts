import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private history: string[]=[];

  constructor(private router: Router,
    private location: Location) { 
      this.router.events.subscribe((event)=>{
        if (event instanceof NavigationEnd && !this.history.find(p=>p == event.urlAfterRedirects)){
          this.history.push(event.urlAfterRedirects)
          //console.log(this.history);
        }
      });
    }

    back():void{
      
      this.history.pop()
      if(this.history.length >0){
        this.location.back()
      }
      else{
        this.router.navigateByUrl('/');
      }
    }

    isHistoryAvailable(){
      return this.history.length <=0;
    }
}
