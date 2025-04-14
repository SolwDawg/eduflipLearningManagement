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
    console.log(`Fetching dashboard data for user ${userId}`);

    // Debug output
    console.log("Using API base URL:", process.env.NEXT_PUBLIC_API_BASE_URL);

    // Instead of calling a single dashboard endpoint, fetch from multiple existing endpoints
    // 1. Fetch enrolled courses
    const enrolledCoursesRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/${userId}/enrolled-courses`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`,
        },
        cache: "no-store",
      }
    );

    // 2. Fetch quiz results
    const quizResultsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/${userId}/quiz-results`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserId}`,
        },
        cache: "no-store",
      }
    );

    // Check if either request failed
    if (!enrolledCoursesRes.ok || !quizResultsRes.ok) {
      const errorSource = !enrolledCoursesRes.ok
        ? "enrolled courses"
        : "quiz results";
      const errorRes = !enrolledCoursesRes.ok
        ? enrolledCoursesRes
        : quizResultsRes;
      const errorText = await errorRes.text();
      console.error(`Backend API error (${errorSource}):`, errorText);

      return NextResponse.json(
        {
          message: `Failed to fetch ${errorSource}`,
          error: errorRes.statusText,
        },
        { status: errorRes.status }
      );
    }

    // Parse responses
    const enrolledCoursesData = await enrolledCoursesRes.json();
    const quizResultsData = await quizResultsRes.json();

    // Calculate some overall stats
    const enrolledCourses = enrolledCoursesData.data || [];
    const quizResults = quizResultsData.data || [];

    const coursesInProgress = enrolledCourses.filter(
      (course: any) =>
        course.overallProgress > 0 && course.overallProgress < 100
    ).length;

    const coursesCompleted = enrolledCourses.filter(
      (course: any) => course.overallProgress === 100
    ).length;

    const averageScore =
      quizResults.length > 0
        ? quizResults.reduce((sum: number, quiz: any) => sum + quiz.score, 0) /
          quizResults.length
        : 0;

    // Combine data into dashboard response
    const dashboardData = {
      message: "User dashboard data retrieved successfully",
      enrolledCourses: enrolledCourses,
      quizResults: quizResults,
      overallStats: {
        totalCourses: enrolledCourses.length,
        coursesInProgress,
        coursesCompleted,
        averageScore,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching user dashboard data:", error);
    // Return a fallback response with empty data to prevent UI errors
    return NextResponse.json(
      {
        message: "Error fetching dashboard data",
        enrolledCourses: [],
        quizResults: [],
        overallStats: {
          totalCourses: 0,
          coursesInProgress: 0,
          coursesCompleted: 0,
          averageScore: 0,
        },
      },
      { status: 200 }
    );
  }
}
