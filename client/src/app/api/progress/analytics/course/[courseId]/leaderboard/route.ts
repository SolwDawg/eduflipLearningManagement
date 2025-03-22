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

    // Get course ID from params
    const courseData = await params;
    const courseId = courseData.courseId;
    console.log(`Fetching leaderboard for course ${courseId}`);

    // Debug output
    console.log("Using API base URL:", process.env.NEXT_PUBLIC_API_BASE_URL);

    // Call backend API to get course leaderboard data
    // In a real implementation, we would call the backend API endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/leaderboard/monthly`,
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
        { error: "Failed to fetch leaderboard data" },
        { status: response.status }
      );
    }

    try {
      // Parse JSON response
      const leaderboardData = await response.json();

      // Extract just the top 3 for the dashboard
      const top3 = leaderboardData.data?.slice(0, 3) || [];

      return NextResponse.json(top3);
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      return NextResponse.json(
        { error: "Invalid response from server" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}
