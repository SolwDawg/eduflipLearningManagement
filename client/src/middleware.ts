import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isStudentRoute = createRouteMatcher(["/user/(.*)"]);
const isTeacherRoute = createRouteMatcher(["/teacher/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Proceed with user authentication and role checks
  const { sessionClaims } = await auth();
  console.log("sessionClaims", sessionClaims);
  const userRole =
    (sessionClaims?.public_metadata as { userType: "student" | "teacher" })
      ?.userType || "student";

  console.log("userRole", userRole);

  // Handle role-based redirections without locale prefixing
  if (isStudentRoute(req)) {
    if (userRole !== "student") {
      const url = new URL("/teacher/courses", req.url);
      return NextResponse.redirect(url);
    }
  }

  if (isTeacherRoute(req)) {
    if (userRole !== "teacher") {
      const url = new URL("/user/courses", req.url);
      return NextResponse.redirect(url);
    }
  }

  // Continue with the request
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Only run on specific paths - exclude static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|mp3|mp4)$).*)",
  ],
};
