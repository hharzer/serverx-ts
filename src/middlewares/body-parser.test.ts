import 'reflect-metadata';

import { BodyParser } from './body-parser';
import { Message } from '../serverx';

import { fromReadableStream } from '../utils';
import { of } from 'rxjs';

import str = require('string-to-stream');

test('BodyParser parses JSON', done => {
  const bodyParser = new BodyParser();
  const body = JSON.stringify({ x : 'y' });
  const message: Message = {
    request: { path: '/foo/bar', method: 'POST', headers: { 'content-type': 'application/json' }, stream$: fromReadableStream(str(body)) }
  };
  bodyParser.prehandle(of(message))
    .subscribe(message => {
      const { request } = message;
      expect(request.body.x).toEqual('y');
      done();
    });
});

test('BodyParser parses form encoded', done => {
  const bodyParser = new BodyParser();
  const body = encodeURIComponent('a=b&x=y');
  const message: Message = {
    request: { path: '/foo/bar', method: 'POST', headers: { 'content-type': 'x-www-form-urlencoded' }, stream$: fromReadableStream(str(body)) }
  };
  bodyParser.prehandle(of(message))
    .subscribe(message => {
      const { request } = message;
      expect(request.body.a).toEqual('b');
      expect(request.body.x).toEqual('y');
      done();
    });
});
