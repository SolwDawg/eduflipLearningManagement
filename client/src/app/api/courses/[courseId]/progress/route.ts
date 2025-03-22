import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Verify user authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const courseId = params.courseId;
    console.log(`Fetching course progress for course ${courseId}`);

    // Forward the request to the backend API
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/courses/${courseId}/progress`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend API error:", errorText);
        return NextResponse.json(
          { error: "Failed to fetch course progress" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error fetching course progress:", error);
      return NextResponse.json(
        { error: "Failed to fetch course progress" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in course progress API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
