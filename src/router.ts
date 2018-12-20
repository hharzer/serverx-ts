import { Class } from './serverx';
import { Handler } from './handler';
import { Map } from './serverx';
import { Message } from './serverx';
import { Method } from './serverx';
import { Middleware } from './middleware';
import { Observable } from 'rxjs';
import { ReflectiveInjector } from 'injection-js';
import { Request } from './serverx';

import { of } from 'rxjs';

import 'reflect-metadata';

/**
 * Route definition
 */

export interface Route {
  children?: Route[];
  data?: any;
  handler?: Class<Handler>;
  injector?: ReflectiveInjector;
  methods?: Method[];
  middlewares?: Class<Middleware>[];
  parent?: Route;
  path: string;
  pathMatch?: 'full' | 'prefix';
  services?: Class[];
}

/**
 * Router implementation
 */

export class Router {

  /** ctor */
  constructor(public readonly routes: Route[]) { }

  /** Instantiate the Handler Observables for a Route */
  makeHandler$(route: Route,
               message: Message): Observable<Message> {
    const handler = Handler.makeInstance(route);
    return handler? handler.handle(of(message)) : of(message);
  }

  /** Instantiate the Middleware Observables for a Route */
  makeMiddlewares$(route: Route,
                   message: Message): Observable<Message>[] {
    const middlewares = [];
    while (route) {
      middlewares.push(...Middleware.makeInstances(route));
      route = route.parent;
    }
    return (middlewares.length === 0)? [of(message)] :
      middlewares.map(middleware => middleware.handle(of(message)));
  }

  /** Route a request */
  route(request: Request): Request {
    const params = { };
    const paths = this.split(request.path);
    const route = this.match(paths, request.method, null, this.routes, params);
    return route? { ...request, params, route } : request;
  }

  // private methods

  private match(paths: string[],
                method: Method,
                parent: Route,
                routes: Route[],
                params: Map<string>): Route | undefined {
    let rpaths = [];
    // try to find matching route
    let route = routes.find((route: Route) => {
      route.parent = parent;
      if (route.methods && !route.methods.includes(method))
        return false;
      if (route.path === '**')
        return true;
      rpaths = this.split(route.path);
      if (rpaths.length === 0)
        return true;
      if ((rpaths.length > paths.length)
       || ((route.pathMatch === 'full') && (rpaths.length !== paths.length)))
        return false;
      return rpaths.every((rpath, ix) => rpath.startsWith(':') || (rpath === paths[ix]));
    });
    // if we found a match, create an injector
    if (route && !route.injector) {
      const providers = (route.services || [])
        .concat(route.middlewares || [])
        .concat(route.handler? [route.handler] : []);
      const resolved = ReflectiveInjector.resolve(providers);
      if (parent)
        route.injector = parent.injector.createChildFromResolved(resolved);
      else route.injector = ReflectiveInjector.fromResolvedProviders(resolved);
    }
    // if we found a match, look to the children
    if (route && route.children && (paths.length > rpaths.length))
      route = this.match(paths.slice(rpaths.length), method, route, route.children, params);
    // if we found a match, accumulate parameters
    if (route) {
      rpaths.forEach((rpath, ix) => {
        if (rpath.startsWith(':'))
          params[rpath.substring(1)] = paths[ix];
      });
    }
    return route;
  }

  private split(path: string): string[] {
    // NOTE: trim out any leading or trailing /
    return (path && (path !== '/'))? path.replace(/^\/|\/$/g, '').split('/') : [];
  }

}