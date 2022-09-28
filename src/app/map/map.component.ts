import {AfterViewInit, Component, ViewEncapsulation} from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import * as L from 'leaflet';

import {MarkerService} from '../marker.service';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';

const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements AfterViewInit {


  markers:Array<any> = [];

  private map: L.Map | undefined;

  constructor(
    private markerService: MarkerService,
    private db: AngularFireDatabase
  ) {
  }

  ngOnInit(): void {
    
  }

  // with current location
  // private initMap(position: { coords: { latitude: any; longitude: any } }): void {
  //   const {
  //     coords: {latitude, longitude},
  //   } = position;
  //
  //   this.map = L.map('map', {center : [latitude, longitude], zoom : 10});
  //
  //   const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  //     maxZoom: 18,
  //     minZoom: 3,
  //   });
  //
  //   tiles.addTo(this.map);
  // }

  private initMap(): void {
    this.map = L.map('map', {
      center: [ 47.6443, 6.8381 ],
      zoom: 14
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
    });

    tiles.addTo(this.map);
  }

  ngAfterViewInit(): void {
    this.initMap();
    
    this.db.database.ref('people').on('value', (snapshot) => {7
      let people = snapshot.val();
      if (people) {

        for (let i = 0; i < this.markers.length; i++) {
          const element = this.markers[i];
          this.markerService.removeCapitalMarkers(this.map, element);
        }

        for (const [key, value] of Object.entries(people)) {
          let m = this.markerService.makeCapitalMarkers(this.map, value);
          this.markers.push(m);
        }
      }
    });
  }

  editMarker() {
    console.log('edit');
  }
}
