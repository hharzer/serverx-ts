import { Handler } from '../handler';
import { HttpApp } from '../http/app';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { Route } from '../router';

import { createServer } from 'http';
import { map } from 'rxjs/operators';

import chalk from 'chalk';


@Injectable()
class Hello implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        const body = 'Hello, http!';
        return { ...message, response: { ...response, body } };
      })
    );
  }
}

@Injectable()
class Goodbye implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        const body = 'Goodbye, http!';
        return { ...message, response: { ...response, body } };
      })
    );
  }
}

const routes: Route[] = [

  {
    path: '',
    methods: ['GET'],
    children: [

      {
        path: '/hello',
        handler: Hello
      },

      {
        path: '/goodbye',
        handler: Goodbye
      }

    ]
  }

];

const app = new HttpApp(routes);
const listener = app.listen();
const server = createServer(listener)
  .on('listening', () => {
    console.log(chalk.cyan('Examples: http-server listening on port 4200'));
  });
server.listen(4200);
