import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/enrollments/student/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Something went wrong" },
        { status: response.status }
      );
    }

    // Format course data for the chat UI
    const coursesForChat = data.data.map((enrollment: any) => ({
      id: enrollment.courseId,
      title: enrollment.courseTitle,
      teacherId: enrollment.teacherId,
      teacherName: enrollment.teacherName,
    }));

    return NextResponse.json({
      message: "Courses retrieved successfully",
      data: coursesForChat,
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
