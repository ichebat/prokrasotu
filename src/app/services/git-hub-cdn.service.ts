import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber, catchError, map, of } from 'rxjs';
import { decrypt, environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GitHubCdnService {
  constructor(private _http: HttpClient) {}

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  getSha(fileName): Observable<any>{
      var owner = environment.gitHubCdnOwner;
      var repo = environment.gitHubCdnRepo;
      var folder = environment.gitHubCdnFolder;
      var fileName = fileName;
      var token = decrypt(environment.pass, environment.gitHubCdnApiToken);
      var url = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}/${fileName}`;
      console.log('Check image exist in GitHubCdn: ' + fileName);
      return this._http.get(url);
  }

  uploadByFile(fileName, base64String, shaString): Observable<any> {
      var selectedFileName = fileName;

      var file = base64String;
      var message = 'uploading to GitHubCdn: ' + selectedFileName;
      var owner = environment.gitHubCdnOwner;
      var repo = environment.gitHubCdnRepo;
      var folder = environment.gitHubCdnFolder;
      var fileName = selectedFileName;
      var token = decrypt(environment.pass, environment.gitHubCdnApiToken);
      //console.log('Зашифрованный ключ для хранения: '+environment.gitHubCdnApiToken);
      var url = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}/${fileName}`;
      var sha = shaString ? shaString : null;
      var content = window.btoa(file);
      var body = sha ? { content, sha, message } : { content, message };
      var bodyStr = JSON.stringify(body);
      var headers = { authorization: `Bearer ${token}` };

      console.log('fileName',fileName);

      if (!sha) console.log('PUT (new) image to GitHubCdn: ' + fileName);
      else console.log('PUT (update) image to GitHubCdn: ' + fileName);

      return this._http.put(url, bodyStr, { headers: headers });
  }

  uploadByFile11(data: any): Observable<any> {
    var result = '';

    var selectedFile = data.file ?? '';
    var selectedFileName = data.fileName ?? '';

    if (!selectedFile) return of(result);
    if (!selectedFileName) return of(result);

    var selectedFileBuffer = selectedFile.arrayBuffer() ?? '';
    var base64String;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      base64String = fileReader.result;
      if (!base64String) return of(result);

      var file = base64String;
      var message = 'uploading to GitHubCdn: ' + selectedFileName;
      var owner = environment.gitHubCdnOwner;
      var repo = environment.gitHubCdnRepo;
      var folder = environment.gitHubCdnFolder;
      var fileName = selectedFileName;
      var token = decrypt(environment.pass, environment.gitHubCdnApiToken);
      var url = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}/${fileName}`;

      console.log('Check image exist in GitHubCdn: ' + fileName);
      this._http.get(url).subscribe({
        next: (data : any) => {
          console.log('Check image data', data);
          var sha = data.sha ? data.sha : null;
          var content = window.btoa(file);
          var body = sha ? { content, sha, message } : { content, message };
          var bodyStr = JSON.stringify(body);
          var headers = { authorization: `Bearer ${token}` };

          console.log('PUT (update) image to GitHubCdn: ' + fileName);
          return this._http.put(url, bodyStr, { headers: headers });
          // .subscribe({
          //   next: (data) => {
          //     console.log('uploadByFile data', data);
          //   },
          //   error: (err) => {
          //     console.log('uploadByFile error', err);
          //   },
          //   complete: () => {
          //     console.log('uploadByFile complete');
          //   },
          // });
        },
        error: (err) => {
          console.log('Check image error', err);
          
          // .subscribe({
          //   next: (data) => {
          //     console.log('uploadByFile data', data);
          //   },
          //   error: (err) => {
          //     console.log('uploadByFile error', err);
          //   },
          //   complete: () => {
          //     console.log('uploadByFile complete');
          //   },
          // });
        },
        complete: () => {
          console.log('Check image complete');
        },
      });

      // return this._http.get(url).
      // pipe(
      //   map((res: any) => {
      //     console.log(res);
      //     var json = res.json();
      //     var sha = json.sha ? json.sha : null;
      //     var content = window.btoa(file);
      //     var body = sha ? { content, sha, message } : { content, message };
      //     var bodyStr = JSON.stringify(body);
      //     var headers = { authorization: `Bearer ${token}` };

      //     console.log('POST image to GitHubCdn: ' + fileName);
      //     return this._http.put(url, bodyStr, { headers: headers }).subscribe({
      //       next: (data) => {
      //         console.log('uploadByFile data', data);
      //       },
      //       error: (err) => {
      //         console.log('uploadByFile error', err);
      //       },
      //       complete: () => {
      //         console.log('uploadByFile complete');
      //       },
      //     });
      //   }),
      //   catchError(this.handleError<string>('get image from GitHub', '')),
      // );
          var content = window.btoa(file);
          var body = { content, message };
          var bodyStr = JSON.stringify(body);
          var headers = { authorization: `Bearer ${token}` };

          console.log('PUT (new) image to GitHubCdn: ' + fileName);
          return this._http.put(url, bodyStr, { headers: headers });
    };
    fileReader.readAsBinaryString(selectedFile);

    return of(result);
  }
}
