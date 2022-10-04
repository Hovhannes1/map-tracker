import {AfterViewInit, Component, HostListener, ViewEncapsulation} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/compat/database';
import * as L from 'leaflet';
import 'leaflet-routing-machine';


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

  private markers: Array<any> = [];
  private paths: Array<any> = [];
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
        this.openMarkerEditPopup('New User Name', e.latlng.lat, e.latlng.lng);
        this.newLocationTriggerActive = false;
      }
    });
  }

  editMarker(markerId: string) {
    const name = this.userData[markerId].name;
    const lat = this.userData[markerId].lat;
    const lon = this.userData[markerId].lon;

    this.openMarkerEditPopup(name, lat, lon);
  }

  delMarker(markerId: number) {
    this.db.database.ref('people/' + markerId).remove().then(() => {
      console.log('Marker deleted');
    });
  }

  addNewLocation() {
    this.newLocationTriggerActive = true;
  }

  openMarkerEditPopup(name: string, lat: number, lon: number) {
    const dialogRef = this.dialog.open(MarkerEditPopup, {
      width: '360px',
      data: {name: name, lon: lon, lat: lat}
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
  }

  calculateMeetingPoints(size: number) {
    // calculating the meeting point
    let sumOfLat = 0;
    let sumOfLon = 0;

    for (const [key, value] of Object.entries(this.userData)) {
      // @ts-ignore
      sumOfLat += +value.lat;
      // @ts-ignore
      sumOfLon += +value.lon;
    }
    return [+sumOfLat / size, +sumOfLon / size];
  }

  calculatePath() {
    const size = Object.keys(this.userData).length;

    // calculating the meeting point
    const [metingPointLat, metingPointLon] = this.calculateMeetingPoints(size);

    //check if there are paths already if yes remove them
    if (this.paths.length > 0) {
      this.cleanPaths();
      //  call the addThePaths function with time out to wait for the map to remove the old paths
      setTimeout(() => {
        this.addThePaths(metingPointLat, metingPointLon, size);

      }, 1000);
    } else {
      this.addThePaths(metingPointLat, metingPointLon, size);
    }

    // adding meeting point marker
    const metingPointMarker = L.marker([metingPointLat, metingPointLon]);
    this.paths.push(metingPointMarker);
    // @ts-ignore
    metingPointMarker.addTo(this.map);
    //  TODO: clean marker
  }

  private static getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '';
    for (let j = 0; j < 6; j++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return '#' + color;
  }

  private addThePaths(metingPointLat: number, metingPointLon: number, size: number) {
    // create random colors list with length of size
    const colors = [];
    for (let i = 0; i < size; i++) {
      colors.push(MapComponent.getRandomColor());
    }

    let i = 0;
    for (const [key, value] of Object.entries(this.userData)) {
      const m = L.Routing.control({
        router: L.Routing.osrmv1({
          serviceUrl: `http://router.project-osrm.org/route/v1/`
        }),
        // @ts-ignore
        lineOptions: {styles: [{color: colors[i], weight: 7}]},
        // disable creatMarker
        createMarker: () => {
          return null;
        },
        waypoints: [
          // @ts-ignore
          L.latLng(value.lat, value.lon),
          L.latLng(metingPointLat, metingPointLon),
        ],
        addWaypoints: false,
        // @ts-ignore
      }).addTo(this.map);

      this.paths.push(m);
      i++;
    }
  }

  private cleanPaths() {
    for (let i = 0; i < this.paths.length; i++) {
      const element = this.paths[i];
      this.map?.removeControl(element);
    }
  }
}
