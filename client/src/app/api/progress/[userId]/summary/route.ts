import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  context: { params: { userId: string } }
): Promise<NextResponse> {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = context.params;

    // Make request to backend API for enrolled courses count
    const enrolledCoursesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/${userId}/enrolled-courses`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let enrolledCourses = [];
    if (enrolledCoursesResponse.ok) {
      const enrolledCoursesData = await enrolledCoursesResponse.json();
      enrolledCourses = enrolledCoursesData.data || [];
    }

    // Make request to backend API for quiz results to get completed quizzes count
    const quizResultsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/${userId}/quiz-results`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let completedQuizzes = 0;
    if (quizResultsResponse.ok) {
      const quizResultsData = await quizResultsResponse.json();
      completedQuizzes = quizResultsData.data ? quizResultsData.data.length : 0;
    }

    // Prepare course progress data
    const courseProgress = await Promise.all(
      enrolledCourses.map(async (course: any) => {
        try {
          // Fetch course details
          const courseResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${course.courseId}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          let title = "Unknown Course";
          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            title = courseData.title || "Unknown Course";
          }

          // Fetch user's progress for this course
          const progressResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/course-progress/${userId}/courses/${course.courseId}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          let progress = 0;
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            progress = progressData.overallProgress || 0;
          }

          return {
            courseId: course.courseId,
            title,
            enrollmentDate: course.enrollmentDate || new Date().toISOString(),
            progress,
          };
        } catch (error) {
          console.error(
            `Error fetching details for course ${course.courseId}:`,
            error
          );
          return {
            courseId: course.courseId,
            title: "Unknown Course",
            enrollmentDate: new Date().toISOString(),
            progress: 0,
          };
        }
      })
    );

    // For now, we don't have achievements, so we'll set a placeholder
    const achievements = Math.min(3, completedQuizzes); // Simple placeholder logic

    return NextResponse.json({
      message: "User progress summary retrieved successfully",
      data: {
        enrolledCourses: enrolledCourses.length,
        completedQuizzes,
        achievements,
        courseProgress,
      },
    });
  } catch (error) {
    console.error("Error getting user progress summary:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      {
        status: 500,
      }
    );
  }
}
