import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import * as L from 'leaflet';
import {Map} from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  data: string = '/assets/data/test-data.geojson';

  constructor(private http: HttpClient) {
  }

  makeCapitalMarkers(map: Map | undefined, people:any) {
    const lon = people.lon;
    const lat = people.lat;
    const name = people.name;
    const marker = L.marker([lon, lat]);

    // @ts-ignore
    marker.addTo(map)
      .bindPopup(`<div class="marker-popup"><div class="marker-popup__title">${name}</div><div>Lon: ${lon}, Lat: ${lat}</div><div><span (click)="editMarker()">Edit</span><span>Remove</span></div></div>`);

    return marker;
  }

  removeCapitalMarkers(map: Map | undefined, marker: L.Marker) {
    map?.removeLayer(marker);
  }
}
