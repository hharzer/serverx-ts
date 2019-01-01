import 'reflect-metadata';

import { Attr } from '../metadata';
import { Compressor } from '../middlewares//compressor';
import { COMPRESSOR_OPTS } from '../middlewares//compressor';
import { Handler } from '../handler';
import { HttpApp } from '../http/app';
import { Injectable } from 'injection-js';
import { Message } from '../interfaces';
import { Observable } from 'rxjs';
import { OpenAPI } from '../handlers/open-api';
import { REQUEST_LOGGER_OPTS } from '../middlewares/request-logger';
import { RequestLogger } from '../middlewares/request-logger';
import { Route } from '../interfaces';

import { createServer } from 'http';
import { table } from 'table';
import { tap } from 'rxjs/operators';

import chalk from 'chalk';

@Injectable() class Explode extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response['x']['y'] = 'z';
      })
    );
  }
}

@Injectable() class Hello extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response.body = 'Hello, http!';
      })
    );
  }
}

@Injectable() class Goodbye extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response.body = 'Goodbye, http!';
      })
    );
  }
}

class FooBarParams {
  @Attr() id: string;
}

const routes: Route[] = [

  {
    path: '',
    methods: ['GET'],
    middlewares: [RequestLogger, Compressor],
    services: [
      { provide: REQUEST_LOGGER_OPTS, useValue: { colorize: true } },
      { provide: COMPRESSOR_OPTS, useValue: { threshold: 0 } } 
    ],
    summary: 'A family of test endpoints',
    children: [

      {
        description: 'Develop OpenAPI representation of this server',
        path: 'openapi.yml',
        handler: OpenAPI
      },

      {
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
        path: '/foo',
        children: [

          {
            path: '/bar/{id}',
            request: {
              path: FooBarParams
            }
          },

          {
            path: '/baz'
          }
          
        ]
      },

      {
        path: '/hello',
        handler: Hello
      },

      {
        description: 'This one will blow your mind!',
        path: '/goodbye',
        handler: Goodbye
      },

      {
        path: '/isalive'
      },

      {
        methods: ['GET'],
        path: '/explode',
        handler: Explode
      },

      {
        methods: ['GET'],
        path: '/not-here',
        redirectTo: 'http://over-there.com'
      }

    ]
  }

];

const app = new HttpApp(routes, { title: 'http-server', version: '1.0' });

const flattened = app.router.flatten()
  .map((route: Route) => [route.methods.join(','), route.path, route.summary ]);
console.log(table(flattened));

const listener = app.listen();
const server = createServer(listener)
  .on('listening', () => {
    console.log(chalk.cyanBright('Examples: http-server listening on port 4200'));
  });
  
server.listen(4200);
