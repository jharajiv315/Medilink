import { app } from '../server.ts';
import type { Request, Response } from 'express';

export default function handler(request: Request, response: Response): void {
  const incomingUrl = new URL(request.url || '/', 'http://localhost');
  const route = incomingUrl.searchParams.get('__route');
  if (!route || route.includes('..') || route.startsWith('/')) {
    response.status(404).end();
    return;
  }

  incomingUrl.searchParams.delete('__route');
  const remainingQuery = incomingUrl.searchParams.toString();
  request.url = `/api/${route}${remainingQuery ? `?${remainingQuery}` : ''}`;
  app(request, response);
}
