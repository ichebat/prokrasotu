import { AfterViewInit, Component, Input } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  ImageCropperComponent,
  ImageCroppedEvent,
  LoadedImage,
} from 'ngx-image-cropper';
import { MaterialModule } from '../../material.module';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-image-cropper-loader',
  templateUrl: './image-cropper-loader.component.html',
  styleUrl: './image-cropper-loader.component.scss',
  standalone: true,
  imports: [ImageCropperComponent, MaterialModule],
})
export class ImageCropperLoaderComponent implements AfterViewInit {
  @Input() maintainAspectRatio: boolean = true; //Keep width and height of cropped image equal according to the aspectRatio
  @Input() containWithinAspectRatio: boolean = true; //When set to true, padding will be added around the image to make it fit to the aspect ratio
  @Input() aspectRatio: number = 1 / 1; //The width / height ratio (e.g. 1 / 1 for a square, 4 / 3, 16 / 9 ...)
  @Input() resizeToWidth: number = 256; //Cropped image will be resized to at most this width (in px)
  @Input() cropperMinWidth: number = 128; //The cropper cannot be made smaller than this number of pixels in width (relative to original image's size) (in px)
  @Input() onlyScaleDown: boolean = true; //When the resizeToWidth or resizeToHeight is set, enabling this option will make sure smaller images are not scaled up
  @Input() roundCropper: boolean = false; //Set this to true for a round cropper. Resulting image will still be square, use border-radius: 100% on resulting image to show it as round.
  @Input() canvasRotation: number = 0; //Rotate the canvas (1 = 90deg, 2 = 180deg...)
  @Input() imageURL: string = ''; //If you don't want to use a file input or a base64 you can set an URL to get the image from. If requesting an image from a different domain make sure Cross-Origin Resource Sharing (CORS) is allowed or the image will fail to load.
  @Input() imageHTMLTagId: string = ''; //Id эелемента на странице, с которого будем считывать base64 картинки

  imageChangedEvent: Event | null = null;
  croppedImage: SafeUrl = '';
  base64String: any;

  constructor(private sanitizer: DomSanitizer,
    private _http: HttpClient,) {}

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

  // async getBase64ImageFromUrl(imageUrl) {
  //   var res = await fetch(imageUrl);
  //   var blob = await res.blob();
  
  //   return new Promise((resolve, reject) => {
  //     var reader  = new FileReader();
  //     reader.addEventListener("load", function () {
  //         resolve(reader.result);
  //     }, false);
  
  //     reader.onerror = () => {
  //       return reject(this);
  //     };
  //     reader.readAsDataURL(blob);
  //   })
  // }
  
  // toDataURL = async (url) => {
  //   console.log("Downloading image...");
  //   var res = await fetch(url);
  //   var blob = await res.blob();

  //   const result = await new Promise((resolve, reject) => {
  //     var reader = new FileReader();
  //     reader.addEventListener("load", function () {
  //       resolve(reader.result);
  //     }, false);

  //     reader.onerror = () => {
  //       return reject(this);
  //     };
  //     reader.readAsDataURL(blob);
  //   })

  //   return result
  // };

  // downloadUrl(url: string, fileName: string) {
  //     const a: any = document.createElement('a');
  //     a.href = url;
  //     a.download = fileName;
  //     document.body.appendChild(a);
  //     a.style = 'display: none';
  //     a.click();
  //     a.remove();
  //   };
  

//   getBase64Image(imgUrl, callback) {
//     var img = new Image();
//     // onload fires when the image is fully loadded, and has width and height
//     img.onload = function(){
//       var canvas = document.createElement("canvas");
//       canvas.width = img.width;
//       canvas.height = img.height;
//       var ctx = canvas.getContext("2d");
//       ctx!.drawImage(img, 0, 0);
//       var dataURL = canvas.toDataURL("image/png"),
//           dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");

//       callback(dataURL); // the base64 string

//     };

//     // set attributes and src 
//     img.setAttribute('crossOrigin', 'Anonymous'); //
//     img.src = imgUrl+ '?r=' + Math.floor(Math.random()*100000);

// }

toDataURL(src, callback, outputFormat) {
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    var canvas = <HTMLCanvasElement> document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var dataURL;
    canvas.height = 300;
    canvas.width = 300;
    ctx!.drawImage(img, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
  };
  img.src = src;
  if (img.complete || img.complete === undefined) {
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    img.src = src;
  }
}



  ngAfterViewInit(): void {
    //if (this.imageURL) this.getBase64(this.imageURL);
    if (this.imageURL) {
      this.toDataURL(this.imageURL,function(dataUrl) {
          console.log('RESULT:', dataUrl)
        },"image/png"
      )

      
    
      //this.toDataURL(this.imageURL);

      // var self = this;
      // //var xhr = new XMLHttpRequest();
      // // xhr.onload = function () {
      // //   var reader = new FileReader();
      // //   reader.onloadend = function () {
      // //     console.log(reader.result);
      // //     self.base64String = reader.result;
      // //     self.croppedImage = self.base64String;
      // //   };
      // //   reader.readAsDataURL(xhr.response);
      // // };
      // var img: any = document.getElementById(this.imageHTMLTagId);

      // // xhr.open('GET', img.src);
      // // xhr.responseType = 'blob';
      // // xhr.send();

      // var canvas = document.createElement('canvas');
      // var ctx = canvas.getContext('2d');
      // canvas.width = img.width;
      // canvas.height = img.height;
      // ctx!.drawImage(img, 0, 0);
      // var dataURL = canvas.toDataURL('image/png');
      // console.log(dataURL);
      // this.base64String = dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
      // this.croppedImage = self.base64String;
    }
  }

  // toDataURL(url, callback) {
  //   var xhr = new XMLHttpRequest();
  //   xhr.onload = function() {
  //     var reader = new FileReader();
  //     reader.onloadend = function() {
  //       callback(reader.result);
  //     }
  //     reader.readAsDataURL(xhr.response);
  //   };
  //   xhr.open('GET', url);
  //   xhr.responseType = 'blob';
  //   xhr.send();
  // }

  // getBase64(imgUrl) {
  //   const self = this;
  //   var xhr = new XMLHttpRequest();
  //   xhr.open("get", imgUrl, true);
  //   // Essential
  //   xhr.responseType = "blob";
  //   xhr.onload = function () {
  //     if (this.status == 200) {
  //       //Get a blob objects
  //       var blob = this.response;
  //       console.log("blob", blob)
  //       //  Essential
  //       let oFileReader = new FileReader();
  //       oFileReader.onloadend = function (e) {
  //         let base64 = e.target;
  //         self.base64String = (<any>base64).result;
  //         console.log("method one ", base64)
  //       };
  //       oFileReader.readAsDataURL(blob);
  //       //==== In order to display the picture on the page, you can delete ====
  //       // var img = document.createElement("img");
  //       // img.onload = function (e) {
  //       //   window.URL.revokeObjectURL(img.src); //  Clear release
  //       // };
  //       // let src = window.URL.createObjectURL(blob);
  //       // img.src = src
  //       // document.getElementById("container1").appendChild(img);
  //       //==== In order to display the picture on the page, you can delete ====

  //     }
  //   }
  //   xhr.send();
  // }
}
