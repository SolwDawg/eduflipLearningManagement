import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    // Verify user authentication
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from params
    const { userId } = await params;
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
      console.log("Quiz results from backend:", quizResults);

      // Ensure we always return a valid data structure even if backend returns empty object
      if (!quizResults || Object.keys(quizResults).length === 0) {
        console.log(
          "Backend returned empty quiz results, returning empty array"
        );
        return NextResponse.json({ data: [] });
      }

      // Handle both formats: direct array or nested in data property
      const resultsData = Array.isArray(quizResults)
        ? quizResults
        : quizResults.data && Array.isArray(quizResults.data)
        ? quizResults.data
        : [];

      console.log(`Returning ${resultsData.length} quiz results to client`);
      return NextResponse.json({ data: resultsData });
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
