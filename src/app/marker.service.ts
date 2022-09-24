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

  makeCapitalMarkers(map: Map | undefined): void {
    this.http.get(this.data).subscribe((res: any) => {
      for (const c of res.features) {
        const lon = c.geometry.coordinates[0];
        const lat = c.geometry.coordinates[1];
        const marker = L.marker([lat, lon]);

        // @ts-ignore
        marker.addTo(map);
      }
    });
  }
}
