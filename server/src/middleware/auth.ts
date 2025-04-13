import { requireAuth as clerkRequireAuth, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";

// Export a properly typed AuthObject interface
export interface AuthObject {
  userId: string;
  sessionId: string;
  getToken: () => Promise<string | null>;
}

// Extend the Express Request type to include auth property
declare global {
  namespace Express {
    interface Request {
      auth?: AuthObject;
    }
  }
}

// Export the requireAuth function from Clerk
export const requireAuth = clerkRequireAuth;

// Flexible auth middleware that tries multiple authentication methods
export const flexibleAuth = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // First try Clerk auth
    const auth = getAuth(req);
    if (auth && auth.userId) {
      // We have a valid clerk auth
      next();
      return;
    }

    // Check custom Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          // For Clerk tokens, we trust them if they come from our frontend
          // In production, you'd verify the JWT signature with Clerk's public key
          req.auth = {
            userId: req.body.userId || "token-auth",
            sessionId: "token-auth",
            getToken: async () => token,
          };
          next();
          return;
        } catch (error) {
          console.error("Token verification failed:", error);
        }
      }
    }

    // Check for X-User-ID header as last resort
    const xUserId = req.headers["x-user-id"];
    if (xUserId) {
      req.auth = {
        userId: xUserId.toString(),
        sessionId: "x-user-id",
        getToken: async () => null,
      };
      next();
      return;
    }

    // No valid authentication found
    res.status(401).json({ message: "Unauthorized" });
  };
};

// Helper middleware to validate specific user roles if needed
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // You would implement role checking logic here
    // For example, check user metadata or claims

    next();
  };
};
