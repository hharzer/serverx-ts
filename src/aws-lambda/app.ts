import { APIGatewayProxyEvent } from 'aws-lambda';
import { App } from '../app';
import { Context } from 'aws-lambda';
import { Message } from '../serverx';
import { Method } from '../serverx';
import { Normalizer } from '../middlewares/normalizer';
import { Response } from '../serverx';
import { Route } from '../serverx';
import { URLSearchParams } from 'url';

import { map } from 'rxjs/operators';
import { of } from 'rxjs';

// NOTE: this middleware is required
const MIDDLEWARE = [Normalizer];

/**
 * AWS Lambda application
 */

export class AWSLambdaApp extends App {

  private event: APIGatewayProxyEvent;
  // @ts-ignore TODO: temporary
  private context: Context;

  /** ctor */
  constructor(routes: Route[]) {
    super(routes, MIDDLEWARE);
  }

  /** AWS Lambda handler method */
  handle(event: APIGatewayProxyEvent,
         context: Context): Promise<Response> {
    this.event = event;
    this.context = context;
    // synthesize Message from Lambda event and context
    const message: Message = {
      context: {
        routes: this.router.routes,
      },
      request: {
        // @see https://stackoverflow.com/questions/41648467
        body: (this.event.body != null) ? JSON.parse(this.event.body) : { },
        headers: this.event.headers || { },
        method: <Method>this.event.httpMethod,
        params: { },
        path: this.event.path,
        query: this.makeSearchParamsFromEvent(this.event),
        route: null,
        stream$: null
      },
      response: {
        body: null,
        headers: { },
        statusCode: null
      }
    };
    return of(message)
      .pipe(map((message: Message): Message => this.router.route(message)))
      .pipe(this.makePipeline(message))
      .pipe(map((message: Message): Response => message.response))
      .toPromise();
  }

  // private methods

  private makeSearchParamsFromEvent(event: APIGatewayProxyEvent): URLSearchParams {
    const params = new URLSearchParams();
    if (event.queryStringParameters) {
      Object.keys(event.queryStringParameters).forEach(k => {
        params.append(k, event.queryStringParameters[k]);
      });
    }
    if (event.multiValueQueryStringParameters) {
      Object.keys(event.multiValueQueryStringParameters).forEach(k => {
        if (!params.has(k)) {
          const vs = event.multiValueQueryStringParameters[k];
          vs.forEach(v => params.append(k, v));
        }
      });
    }
    return params;
  }

}
