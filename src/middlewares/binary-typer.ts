import { Inject } from 'injection-js';
import { Injectable } from 'injection-js';
import { InjectionToken } from 'injection-js';
import { Message } from '../interfaces';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { Optional } from 'injection-js';
import { Response } from '../interfaces';

import { defaultIfEmpty } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

/**
 * Binary types
 */

export const BINARY_TYPES = new InjectionToken<string[]>('BINARY_TYPES');

export const BINARY_TYPES_DEFAULT: string[] = [
  '*/*'
];

/**
 * Binary typer for AWS Lambda
 * 
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings.html
 */

@Injectable() export class BinaryTyper extends Middleware {

  private binaryTypes: string[];

  constructor(@Optional() @Inject(BINARY_TYPES) binaryTypes: string[]) {
    super();
    this.binaryTypes = binaryTypes || BINARY_TYPES_DEFAULT;
  }

  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      switchMap((message: Message): Observable<Message> => {
        return of(message).pipe(
          filter(({ response }) => !!response.body),
          tap(({ response }) => response.body = Buffer.from(response.body)),
          filter(({ response }) => this.isBinaryType(response)),
          tap(({ response }) => response.isBase64Encoded = true),
          defaultIfEmpty(message)
        );
      })
    );
  }

  // private methods

  private isBinaryType(response: Response): boolean {
    if (response.headers['Content-Encoding'])
      return true;
    else if (response.headers['Content-Type']) {
      const contentType = <string>response.headers['Content-Type'];
      const parts = contentType.split('/');
      return this.binaryTypes.some(binaryType => {
        const matches = binaryType.split('/');
        return ((parts.length === matches.length)
            && (parts.length === 2)
            && (parts[0] === matches[0] || matches[0] === '*')
            && (parts[1] === matches[1] || matches[1] === '*'));
      });
    }
    else return false;
  }

}