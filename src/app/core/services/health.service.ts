import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HealthService {
  constructor(private http: HttpClient) {}

  ping(): Observable<string> {
    // Esta firma devuelve Observable<string>
    return this.http.get(environment.apiBase + environment.health, {
      responseType: 'text',
    });
  }
}
