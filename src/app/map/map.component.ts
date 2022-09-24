import {AfterViewInit, Component, ViewEncapsulation} from '@angular/core';
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
  private map: L.Map | undefined;

  constructor(
    private markerService: MarkerService
  ) {
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
    // with current location
    // if (navigator.geolocation) {
    //   navigator.geolocation.getCurrentPosition(this.initMap.bind(this));
    // }
    this.markerService.makeCapitalMarkers(this.map);
  }
}
