import {Component, HostListener, OnDestroy, ViewEncapsulation} from '@angular/core';
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
export class MapComponent implements OnDestroy {

  public newLocationTriggerActive = false;
  public newCheckpointTriggerActive = false;

  private markers: Array<any> = [];
  private paths: Array<any> = [];
  private map: L.Map | undefined;
  private userData: any;

  private myCurrentKey: string = '';
  private myCurrentLocation: any;
  private myCurrentName: string = '';
  private myCheckpoints: any = [];
  public myCheckpointMarkersList: any = [];

  constructor(
    private markerService: MarkerService,
    private db: AngularFireDatabase,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
  //  send my current location fist time I open the app to the database
    navigator.geolocation.getCurrentPosition((position) => {
      this.openMarkerEditPopup('New User Name', position.coords.latitude, position.coords.longitude, '' ,(res) => {
        this.myCurrentKey = res.key;
        this.myCurrentLocation = {lat: position.coords.latitude, lon: position.coords.longitude};

        // init the map after I get my current location
        this.afterViewInit();
      });
    })

    // Run ngOnDestroy function when I close/reload the browser tab
    window.onbeforeunload = () => this.ngOnDestroy();
  }

  locationChanged = (position: any) => {
    if (this.myCurrentKey && this.myCurrentLocation) {
      // check if coordinate changes are significant enough: the threshold is 0.0001
      const isSignificant = Math.abs(position.coords.latitude - this.myCurrentLocation.lat) > 0.0001 ||
        Math.abs(position.coords.longitude - this.myCurrentLocation.lon) > 0.0001;
      if (isSignificant) {
        this.saveEditedMarkerPosition(this.myCurrentKey, this.myCurrentName, position.coords.latitude, position.coords.longitude);
      }
    }
  }

  locationChangeError = (err: any) => {
    console.log(`ERROR(${err.code}): ${err.message}`);
  }

  ngOnDestroy(): void {
  //  delete my location from the database when I close the app
    this.db.database.ref('people/' + this.myCurrentKey).remove().then(() => {
      console.log('Marker deleted');
    });
  }

  private initMap(position: any): void {
    this.map = L.map('map', {
      center: [position.lat, position.lon],
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

  afterViewInit(): void {
    this.initMap(this.myCurrentLocation);

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

    // listen to the geolocation changes
    navigator.geolocation.watchPosition(this.locationChanged, this.locationChangeError, {
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 0
    });

    // adding new location function
    this.map?.on("click", e => {
      if (this.newLocationTriggerActive) {
        this.openMarkerEditPopup('New User Name', e.latlng.lat, e.latlng.lng);
        this.newLocationTriggerActive = false;
      }
      if (this.newCheckpointTriggerActive) {
        this.addNewCheckpoint(e)
      }
    });
  }

  editMarker(markerId: string) {
    const name = this.userData[markerId].name;
    const lat = this.userData[markerId].lat;
    const lon = this.userData[markerId].lon;

    this.openMarkerEditPopup(name, lat, lon, markerId);
  }

  delMarker(markerId: number) {
    this.db.database.ref('people/' + markerId).remove().then(() => {
      console.log('Marker deleted');
    });
  }

  addNewLocationTrigger() {
    this.newLocationTriggerActive = true;
  }

  addNewCheckpointTrigger() {
    this.newCheckpointTriggerActive = true;
  }

  clearCheckpoints() {
    this.myCheckpoints = [];
    this.myCheckpointMarkersList.forEach((marker: any) => {
      this.map?.removeLayer(marker);
    });
    this.myCheckpointMarkersList = [];
  }

  addNewCheckpoint(e: L.LeafletMouseEvent) {
    const newCheckpoint = L.latLng(e.latlng.lat, e.latlng.lng)
    this.myCheckpoints.push(newCheckpoint);
    const myIcon = L.icon({
      iconUrl: 'assets/point.png',
      iconSize: [36, 36],
      iconAnchor: [18, 35],
    });
    const newCheckpointMarker = L.marker(newCheckpoint, {icon: myIcon});
    this.myCheckpointMarkersList.push(newCheckpointMarker);
    // @ts-ignore
    newCheckpointMarker.addTo(this.map);
    this.newCheckpointTriggerActive = false;
  }

  openMarkerEditPopup(name: string, lat: number, lon: number, markerId?: string, callback?: (res?:any) => void) {
    const dialogRef = this.dialog.open(MarkerEditPopup, {
      width: '360px',
      data: {name: name, lon: lon, lat: lat}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (markerId) {
          this.saveEditedMarkerPosition(markerId, result.name, result.lat, result.lon);
        } else {
          if (callback) this.myCurrentName = result.name;
          this.saveNewMarkerPosition(result.name, result.lat, result.lon, callback ? callback : () => {});
        }
      }
    });
  }

  calculateMeetingPoints(size: number) {
    // calculating the meeting point
    let sumOfLat = 0;
    let sumOfLon = 0;

    for (const [, value] of Object.entries(this.userData)) {
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
    const meetingPointMarker = L.marker([metingPointLat, metingPointLon]);
    this.paths.push(meetingPointMarker);
    // @ts-ignore
    meetingPointMarker.addTo(this.map);
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
    for (const [, value] of Object.entries(this.userData)) {
      let path;
      // @ts-ignore
      if (value.name == this.myCurrentName) {
        path = L.Routing.control({
          router: L.Routing.osrmv1({
            serviceUrl: `https://router.project-osrm.org/route/v1/`,
          }),
          // router: L.Routing.graphHopper('a585904f-5193-4605-bc3c-870c4f472177' , {
          //   urlParameters: {
          //     vehicle: 'car'
          //   }
          // })
          // @ts-ignore
          lineOptions: {styles: [{color: colors[i], weight: 7}]},
          // disable creatMarker
          createMarker: () => {
            return null;
          },
          fitSelectedRoutes: false,
          waypoints: [
            // @ts-ignore
            L.latLng(value.lat, value.lon),
            ...this.myCheckpoints,
            L.latLng(metingPointLat, metingPointLon),
          ],
        })
      } else {
        path = L.Routing.control({
          router: L.Routing.osrmv1({
            serviceUrl: `http://router.project-osrm.org/route/v1/`,
          }),
          // @ts-ignore
          lineOptions: {styles: [{color: colors[i], weight: 7}]},
          // disable creatMarker
          createMarker: () => {
            return null;
          },
          fitSelectedRoutes: false,
          waypoints: [
            // @ts-ignore
            L.latLng(value.lat, value.lon),
            L.latLng(metingPointLat, metingPointLon),
          ],
        })
      }
      // @ts-ignore
      path.addTo(this.map);
      // m.getRouter().options.urlParameters.vehicle = 'foot';

      this.paths.push(path);
      i++;
    }
  }

  private cleanPaths() {
    for (let i = 0; i < this.paths.length; i++) {
      const element = this.paths[i];
      // if last child (the marker) remove layer
      if (i === this.paths.length - 1) {
        this.map?.removeLayer(element);
      } else {
        this.map?.removeControl(element);
      }
    }
  }

  private saveEditedMarkerPosition(markerId: string, name: string, lat: number, lon: number) {
    this.db.database.ref('people/' + markerId).update({
      name: name,
      lat: lat,
      lon: lon
    }).then(() => {
      console.log('Marker updated');
    });
  }

  private saveNewMarkerPosition(name: string, lat: number, lon: number, callback?: (res?:any) => void) {
    this.db.database.ref('people').push({
      name: name,
      lat: lat,
      lon: lon
    }).then((res ) => {
      callback && callback(res);
      console.log('Marker saved');
    });
  }
}
