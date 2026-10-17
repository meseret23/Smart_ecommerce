
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return secret;
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication token is required.',
    });
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded === 'string' ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.role !== 'string'
    ) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
      return;
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
}
