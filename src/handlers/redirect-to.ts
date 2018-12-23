import { Handler } from '../handler';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { StatusCode } from '../serverx';

import { tap } from 'rxjs/operators';

/**
 * Redirect handler
 */

export class RedirectTo extends Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { request, response } = message;
        response.headers = { Location: request.route.redirectTo };
        response.statusCode = request.route.redirectAs || StatusCode.REDIRECT;
      })
    );
  }

}