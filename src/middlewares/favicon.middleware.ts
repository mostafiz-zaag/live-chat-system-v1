// src/middleware/favicon.middleware.ts
import { NextFunction, Request, Response } from 'express';

export function faviconMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.url === '/favicon.ico') {
    return res.status(204).end(); // No content for favicon request
  }
  next();
}
