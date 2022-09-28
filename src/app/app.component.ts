import { HttpClient } from '@angular/common/http';
import {Component, ViewEncapsulation} from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  title = 'map-tracker';

  constructor(
    private db: AngularFireDatabase,
    private http: HttpClient
  ) {

  }

  ngOnInit() {
    
  }


}
