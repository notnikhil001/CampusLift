import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('❌ Error Caught:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation error', 400, 'VALIDATION_ERROR', formattedErrors);
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return sendError(res, 'A record with this value already exists', 409, 'DUPLICATE_ENTRY');
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Resource not found', 404, 'NOT_FOUND');
    }
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected server error occurred'
    : err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, err.code || 'INTERNAL_ERROR');
}
