import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
  try {
    // Verify authentication
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the token for backend API call
    let token = null;
    try {
      token = await getToken();
    } catch (error) {
      console.error("Failed to get auth token:", error);
    }

    const { courseId } = await params;

    console.log("Fetching quiz completion count for course:", courseId);
    console.log("User ID:", userId);

    // Fetch quiz completion count from your backend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/teachers/course/${courseId}/quiz-completion-count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : `Bearer ${userId}`,
        },
      }
    );

    console.log("Quiz completion count API response status:", response.status);

    // If the response isn't successful, return the error
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend API error:", errorText);

      return NextResponse.json(
        {
          message: `Failed to fetch quiz completion count: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    // Return the quiz completion count data
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching quiz completion count:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
