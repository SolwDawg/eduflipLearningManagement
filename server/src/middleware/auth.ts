import { requireAuth as clerkRequireAuth, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";

// Export a properly typed AuthObject interface
export interface AuthObject {
  userId: string;
  userName: string;
  sessionId: string;
  getToken: () => Promise<string | null>;
}

// Export the requireAuth function from Clerk
export const requireAuth = clerkRequireAuth;

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
