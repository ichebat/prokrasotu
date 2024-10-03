import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  ImageCropperComponent,
  ImageCroppedEvent,
  LoadedImage,
} from 'ngx-image-cropper';
import { MaterialModule } from '../../material.module';
import { HttpClient } from '@angular/common/http';
import { GitHubCdnService } from '../../services/git-hub-cdn.service';

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
  @Input() targetHTMLElement: string = ''; //Id element на который выводить изображение
  @Input() gitHubFileName: string = ''; //Имя файла под которым загружать на GitHub
  @Input() useImageAspectRatio: boolean = false; //если true то aspectRatio будет как у загружаемого изображения

  @Output() public onGitHubLoaded: EventEmitter<any> = new EventEmitter<any>();
  @Output() public onGitHubLoading: EventEmitter<any> = new EventEmitter<any>();

  imageChangedEvent: Event | null = null;
  croppedImage: SafeUrl = '';
  croppedImageBlob: any = '';
  selectedFile: any = '';

  git = inject(GitHubCdnService);

  constructor(
    private sanitizer: DomSanitizer,
    private _http: HttpClient,
  ) {}

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
    this.selectedFile = event.target.files[0] ?? '';
    
    if (this.useImageAspectRatio && this.selectedFile)
    {
      let fr = new FileReader();
      fr.onload = () => { // when file has loaded
        var img = new Image();
        img.onload = () => {
          this.aspectRatio = img.width / img.height;
          
        };
        img.src = fr.result!.toString(); // This is the data URL 
      };
      fr.readAsDataURL(this.selectedFile);
    }

    console.log(this.selectedFile);
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl!);
    this.croppedImageBlob = event.blob;
    if (this.targetHTMLElement)
      (<HTMLImageElement>document.getElementById(this.targetHTMLElement)).src =
        event.objectUrl!; //event.base64!;

    //console.log(event.base64);
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
  ngAfterViewInit(): void {}

  public gitHubLoad(): void {
    this.onGitHubLoading.emit(true);
    //const selectedFile = this.selectedFile;
    const fileName = this.gitHubFileName;

    if (!this.croppedImage || !this.croppedImageBlob || !fileName) return;

    var base64String = this.croppedImageBlob;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      base64String = fileReader.result;
      this.git.getSha(fileName).subscribe({
        next: (data: any) => {
          // console.log('data');
          // console.log(data.sha);
          var sha = data.sha;
          this.git.uploadByFile(fileName, base64String, sha).subscribe({
            next: (data: any) => {
              //console.log(data);
              this.onGitHubLoaded.emit(data);
              this.onGitHubLoading.emit(false);
            },
            error: (err) => {
              console.log('uploadByFile error', err);
              this.onGitHubLoading.emit(false);
            },
            complete: () => {
              console.log('uploadByFile complete');
              this.onGitHubLoading.emit(false);
            },
          });
        },
        error: (err) => {
          this.git.uploadByFile(fileName, base64String, '').subscribe({
            next: (data: any) => {
              //console.log(data);
              this.onGitHubLoaded.emit(data);
              this.onGitHubLoading.emit(false);
            },
            error: (err) => {
              console.log('uploadNewByFile error', err);
              this.onGitHubLoading.emit(false);
            },
            complete: () => {
              console.log('uploadNewByFile complete');
              this.onGitHubLoading.emit(false);
            },
          });
        },
        complete: () => {},
      });
    };
    fileReader.readAsBinaryString(this.croppedImageBlob);
  }
}
