import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    // Get user ID from params
    const userData = await params;
    const userId = userData.userId;
    console.log(`Fetching quiz results for user ${userId}`);

    // Debug output
    console.log("Using API base URL:", process.env.NEXT_PUBLIC_API_BASE_URL);

    // Call backend API to get quiz results
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/${userId}/quiz-results`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    console.log("Backend API response status:", response.status);

    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch quiz results" },
        { status: response.status }
      );
    }

    try {
      // Parse JSON response
      const quizResults = await response.json();
      return NextResponse.json({ data: quizResults });
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      return NextResponse.json(
        { error: "Invalid response from server" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz results" },
      { status: 500 }
    );
  }
}
