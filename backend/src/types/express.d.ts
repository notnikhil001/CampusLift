import { UserRole } from '@prisma/client';

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  collegeId: string;
  role: UserRole;
  isVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUserPayload;
  }
}

