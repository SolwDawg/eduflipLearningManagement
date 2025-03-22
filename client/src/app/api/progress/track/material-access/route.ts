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
    console.log("Tracking material access with data:", data);

    // Debug output
    console.log("Using API base URL:", process.env.NEXT_PUBLIC_API_BASE_URL);

    // Call backend API to track material access
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/track/material-access`,
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
        { error: "Failed to track material access" },
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
    console.error("Error tracking material access:", error);
    return NextResponse.json(
      { error: "Failed to track material access" },
      { status: 500 }
    );
  }
}
