import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get params and ensure they're awaited in Next.js 14+
    const paramsData = await params;
    const courseId = paramsData.courseId;
    const userId = paramsData.userId;

    console.log(
      `Fetching analytics for course: ${courseId}, student: ${userId}`
    );

    // Use correct endpoint structure: backend uses /users/course-progress for analytics
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/analytics/course/${courseId}/student/${userId}`,
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
          data: {},
        }),
        { status: 500 }
      );
    }

    console.log("Successfully fetched student progress analytics");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching student progress analytics:", error);
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
