import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistanceService } from '../../storage/storage-persistance.service';
import { UrlService } from '../../utils/url/url.service';
import { ParResponse } from './par-response';

@Injectable()
export class ParService {
  constructor(
    private loggerService: LoggerService,
    private urlService: UrlService,
    private dataService: DataService,
    private storagePersistanceService: StoragePersistanceService
  ) {}

  postParRequest(customParams?: { [key: string]: string | number | boolean }): Observable<ParResponse> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const authWellKnown = this.storagePersistanceService.read('authWellKnownEndPoints');

    if (!authWellKnown) {
      return throwError('Could not read PAR endpoint because authWellKnownEndPoints are not given');
    }

    const parEndpoint = authWellKnown.parEndpoint;
    if (!parEndpoint) {
      return throwError('Could not read PAR endpoint from authWellKnownEndpoints');
    }

    const data = this.urlService.createBodyForParCodeFlowRequest(customParams);

    return this.dataService.post(parEndpoint, data, headers).pipe(
      map((response: any) => {
        this.loggerService.logDebug('par response: ', response);

        return {
          expiresIn: response.expires_in,
          requestUri: response.request_uri,
        };
      }),
      catchError((error) => {
        const errorMessage = `There was an error on ParService postParRequest`;
        this.loggerService.logError(errorMessage, error);
        return throwError(errorMessage);
      })
    );
  }
}
