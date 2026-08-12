export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details: any[] = []
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(404, code, message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST', details: any[] = []) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', code = 'UNAUTHORIZED') {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access', code = 'FORBIDDEN') {
    super(403, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict state', code = 'CONFLICT') {
    super(409, code, message);
  }
}
