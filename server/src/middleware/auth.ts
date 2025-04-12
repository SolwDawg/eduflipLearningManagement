import { requireAuth as clerkRequireAuth, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";

// Export a properly typed AuthObject interface
export interface AuthObject {
  userId: string;
  sessionId: string;
  getToken: () => Promise<string | null>;
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
      const userId = authHeader.split(" ")[1];
      if (userId) {
        req.auth = { userId, sessionId: "custom-auth" } as any;
        next();
        return;
      }
    }

    // Check for X-User-ID header as last resort
    const xUserId = req.headers["x-user-id"];
    if (xUserId) {
      req.auth = { userId: xUserId.toString(), sessionId: "x-user-id" } as any;
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
