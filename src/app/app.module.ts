import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {HttpClientModule} from '@angular/common/http';

import {AppComponent} from './app.component';
import {MapComponent} from './map/map.component';

import {MarkerService} from "./marker.service";

import {AngularFireModule} from '@angular/fire/compat';
import {AngularFireAuthModule} from '@angular/fire/compat/auth';
import {AngularFireStorageModule} from '@angular/fire/compat/storage';
import {AngularFirestoreModule} from '@angular/fire/compat/firestore';
import {AngularFireDatabaseModule} from '@angular/fire/compat/database';
import {environment} from '../environments/environment';

import {MarkerEditPopup} from "./marker-edit-popup/marker-edit-popup";
// Material components
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';


@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    MarkerEditPopup
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireDatabaseModule,
    BrowserModule,
    HttpClientModule,
    MatButtonModule,
    MatDialogModule,
  ],
  providers: [
    MarkerService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
