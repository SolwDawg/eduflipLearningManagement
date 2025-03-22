import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get request body
    const data = await request.json();
    console.log("Tracking quiz result with data:", data);

    // Debug output
    console.log("Using API base URL:", process.env.NEXT_PUBLIC_API_BASE_URL);

    // Call backend API to track quiz result
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/track/quiz-result`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        { error: "Failed to track quiz result" },
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
