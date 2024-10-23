import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appScrollNearEnd]',
})
export class ScrollNearEndDirective implements OnInit, OnDestroy {
  @Output() nearEnd: EventEmitter<void> = new EventEmitter<void>();
  scroll = (event): void => {
   
    // height of whole window page
    const heightOfWholePage = this.window.document.documentElement.scrollHeight;

    // how big in pixels the element is
    const heightOfElement = this.el.nativeElement.scrollHeight;

    // currently scrolled Y position
    const currentScrolledY =      
      this.el.nativeElement.getBoundingClientRect().top;

    // height of opened window - shrinks if console is opened
    const innerHeight = this.window.innerHeight;

    /**
     * the area between the start of the page and when this element is visible
     * in the parent component
     */
    //const spaceOfElementAndPage = heightOfWholePage - heightOfElement;

    // calculated whether we are near the end
    const scrollToBottom =
      heightOfElement + currentScrolledY - innerHeight;
    

    // if the user is near end
    if (scrollToBottom < this.threshold) {
      this.nearEnd.emit();
    }
  };

  /**
   * threshold in PX when to emit before page end scroll
   */
  @Input() threshold = 120;

  private window!: Window;

  constructor(private el: ElementRef) {
  }

  ngOnInit(): void {
    this.window = window;
    this.window.addEventListener('scroll', this.scroll, true);
  }

  ngOnDestroy() {
    this.window.removeEventListener('scroll', this.scroll, true);
  }

}
