import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get courseId and ensure it's awaited in Next.js 14+
    const courseData = await params;
    const courseId = courseData.courseId;

    console.log(`Fetching quiz results for course: ${courseId}`);

    // Use correct endpoint structure: backend uses /users/course-progress for analytics
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/analytics/course/${courseId}/quiz-results`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Backend API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || "Unknown error" };
      }

      console.error("Error response from backend:", errorData);
      return new NextResponse(JSON.stringify(errorData), {
        status: response.status,
      });
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse response JSON:", text);
      return new NextResponse(
        JSON.stringify({
          message: "Failed to parse backend response",
          data: [],
        }),
        { status: 500 }
      );
    }

    console.log("Successfully fetched course quiz results");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching course quiz results:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
      }
    );
  }
}
