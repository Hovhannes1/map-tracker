import {AfterViewInit, Component, HostListener, ViewEncapsulation} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/compat/database';
import * as L from 'leaflet';

import {MarkerService} from '../marker.service';
import {MarkerEditPopup} from "../marker-edit-popup/marker-edit-popup";
import {MatDialog} from "@angular/material/dialog";

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

  public newLocationTriggerActive = false;

  markers: Array<any> = [];
  private map: L.Map | undefined;
  private userData: any;

  constructor(
    private markerService: MarkerService,
    private db: AngularFireDatabase,
    private dialog: MatDialog
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
      center: [47.6443, 6.8381],
      zoom: 14
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
    });

    tiles.addTo(this.map);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (event.target.id === 'edit-marker')
      this.editMarker(event.target.parentElement.getAttribute('markerId'));
    if (event.target.id === 'del-marker')
      this.delMarker(event.target.parentElement.getAttribute('markerId'));
  }

  ngAfterViewInit(): void {
    this.initMap();

    this.db.database.ref('people').on('value', (snapshot: any) => {
      let people = snapshot.val();
      if (people) {
        this.userData = people;

        for (let i = 0; i < this.markers.length; i++) {
          const element = this.markers[i];
          this.markerService.removeUserLocationMarkers(this.map, element);
        }

        for (const [key, value] of Object.entries(people)) {
          let m = this.markerService.makeUserLocationMarkers(this.map, value, key);
          this.markers.push(m);
        }
      }
    });

    // @ts-ignore
    this.map.on("click", e => {
      console.log(e.latlng); // get the coordinates
      if (this.newLocationTriggerActive) {
        const dialogRef = this.dialog.open(MarkerEditPopup, {
          width: '360px',
          data: {name: 'New User Name', lon: e.latlng.lng, lat: e.latlng.lat}
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.db.database.ref('people').push({
              name: result.name,
              lat: result.lat,
              lon: result.lon
            });
          }
        });
        this.newLocationTriggerActive = false;
      }
    });
  }

  editMarker(markerId: string) {
    const name = this.userData[markerId].name;
    const lat = this.userData[markerId].lat;
    const lon = this.userData[markerId].lon;

    const dialogRef = this.dialog.open(MarkerEditPopup, {
      width: '360px',
      data: {name: name, lon: lon, lat: lat}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.db.database.ref('people/' + markerId).update({
          name: result.name,
          lat: result.lat,
          lon: result.lon
        });
      }
    });
  }

  delMarker(markerId: number) {
    this.db.database.ref('people/' + markerId).remove().then(() => {
      console.log('Marker deleted');
    });
  }

  addNewLocation() {
    this.newLocationTriggerActive = true;
  }
}
