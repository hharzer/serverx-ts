import { HttpApp } from '../http/app';
import { IncomingMessage } from 'http';
import { OutgoingMessage } from 'http';
import { Route } from '../interfaces';
import { Timer } from './timer';

const routes: Route[] = [

  {
    path: '',
    middlewares: [Timer],
    children: [

      {
        methods: ['GET'],
        path: '/foo/bar'
      }

    ]
  }

];

describe('Timer unit tests', () => {

  test('sets appropriate headers', done => {
    const app = new HttpApp(routes);
    const listener = app.listen();
    const now = Date.now();
    app['response$'].subscribe(response => {
      expect(Number(response.headers['X-Request-Timein'])).toBeGreaterThan(now);
      expect(Number(response.headers['X-Request-Timeout'])).toBeGreaterThan(now);
      expect(Number(response.headers['X-Response-Time'])).toBeGreaterThan(0);
      expect(response.statusCode).toEqual(200);
      done();
    });
    listener({ method: 'GET', url: '/foo/bar' } as IncomingMessage, { } as OutgoingMessage);
  });

});
