import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Fetching teacher courses");

    // Forward the request to the backend API
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/courses/teacher/${clerkUserId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend API error (${response.status}):`, errorText);

        // Instead of returning an error, return an empty array of courses
        if (response.status === 404) {
          console.log("No courses found for teacher, returning empty array");
          return NextResponse.json([]);
        }

        return NextResponse.json(
          { error: "Failed to fetch teacher courses" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error fetching teacher courses:", error);
      // Return empty array instead of error
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error in teacher courses API route:", error);
    // Return empty array instead of error
    return NextResponse.json([]);
  }
}
