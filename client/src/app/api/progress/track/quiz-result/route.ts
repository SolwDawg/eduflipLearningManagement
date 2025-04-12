import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get request body
    const data = await request.json();
    console.log("Tracking quiz result with data:", data);

    // If we don't have quizId, return error
    if (!data.quizId) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      );
    }

    // Use a hardcoded API base URL if the environment variable is not set
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.eduflip.com";
    console.log("Using API base URL:", apiBaseUrl);

    // Call backend API to track quiz result
    const response = await fetch(
      `${apiBaseUrl}/api/progress/track/quiz-result`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userId}`, // Include auth
        },
        body: JSON.stringify(data),
      }
    );

    console.log("Backend API response status:", response.status);

    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend API error:", errorText);
      return NextResponse.json(
        {
          error: `Failed to track quiz result: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    try {
      // Parse JSON response
      const responseData = await response.json();
      return NextResponse.json(responseData);
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      return NextResponse.json(
        { error: "Invalid response from server" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error tracking quiz result:", error);
    return NextResponse.json(
      { error: "Failed to track quiz result" },
      { status: 500 }
    );
  }
}
