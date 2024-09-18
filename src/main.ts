import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

//config(); // load environment variables from .env file
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
