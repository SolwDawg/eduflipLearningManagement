import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const { userId, courseId, chapterId } = await req.json();

    // Make request to backend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/progress/track/material-access`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, courseId, chapterId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return new NextResponse(JSON.stringify(errorData), {
        status: response.status,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error tracking material access:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      {
        status: 500,
      }
    );
  }
}
