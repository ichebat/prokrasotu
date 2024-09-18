import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  ImageCropperComponent,
  ImageCroppedEvent,
  LoadedImage,
} from 'ngx-image-cropper';

@Component({
  selector: 'app-image-cropper-loader',
  templateUrl: './image-cropper-loader.component.html',
  styleUrl: './image-cropper-loader.component.scss',
  standalone: true,
  imports: [ImageCropperComponent]
})
export class ImageCropperLoaderComponent {
  @Input() maintainAspectRatio: boolean = false; //Keep width and height of cropped image equal according to the aspectRatio
  @Input() containWithinAspectRatio: boolean = true; //When set to true, padding will be added around the image to make it fit to the aspect ratio
  @Input() aspectRatio: number = 1 / 1; //The width / height ratio (e.g. 1 / 1 for a square, 4 / 3, 16 / 9 ...)
  @Input() resizeToWidth: number = 256; //Cropped image will be resized to at most this width (in px)
  @Input() cropperMinWidth: number = 128; //The cropper cannot be made smaller than this number of pixels in width (relative to original image's size) (in px)
  @Input() onlyScaleDown: boolean = true; //When the resizeToWidth or resizeToHeight is set, enabling this option will make sure smaller images are not scaled up
  @Input() roundCropper: boolean = false; //Set this to true for a round cropper. Resulting image will still be square, use border-radius: 100% on resulting image to show it as round.
  @Input() canvasRotation: number = 0; //Rotate the canvas (1 = 90deg, 2 = 180deg...)

  imageChangedEvent: Event | null = null;
  croppedImage: SafeUrl = '';

  constructor(private sanitizer: DomSanitizer) {}

  fileChangeEvent(event: Event): void {
    this.imageChangedEvent = event;
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl!);
    // event.blob can be used to upload the cropped image
  }
  imageLoaded(image: LoadedImage) {
    // show cropper
}
  cropperReady() {
    // cropper ready
  }
  loadImageFailed() {
    // show message
  }
}
