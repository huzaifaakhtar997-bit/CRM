import { UserRole, UserStatus } from "@prisma/client";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
  timestamp: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseData {
  user: UserResponse;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
