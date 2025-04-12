import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import Course from "../models/courseModel";
import UserCourseProgress from "../models/userCourseProgressModel";
import { clerkClient } from "../index";

/**
 * Get teacher dashboard data including summary of courses and students
 */
export const getTeacherDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const teacherId = auth.userId;

    // Get all courses created by this teacher
    const teacherCourses = await Course.scan({
      teacherId: teacherId,
    }).exec();

    if (teacherCourses.length === 0) {
      res.json({
        message: "No courses found",
        data: {
          totalCourses: 0,
          totalStudents: 0,
          publishedCourses: 0,
          draftCourses: 0,
          courses: [],
        },
      });
      return;
    }

    // Calculate stats
    let totalStudents = 0;
    let publishedCourses = 0;
    let draftCourses = 0;

    // Course summaries with enrollment counts
    const courseSummaries = teacherCourses.map((course) => {
      const enrollmentCount = course.enrollments
        ? course.enrollments.length
        : 0;
      totalStudents += enrollmentCount;

      if (course.status === "Published") {
        publishedCourses++;
      } else {
        draftCourses++;
      }

      return {
        courseId: course.courseId,
        title: course.title,
        status: course.status,
        enrollmentCount,
        level: course.level,
        image: course.image,
      };
    });

    // Sort courses by enrollment count (most popular first)
    courseSummaries.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

    res.json({
      message: "Teacher dashboard data retrieved successfully",
      data: {
        totalCourses: teacherCourses.length,
        totalStudents,
        publishedCourses,
        draftCourses,
        courses: courseSummaries,
      },
    });
  } catch (error) {
    console.error("Error retrieving teacher dashboard:", error);
    res.status(500).json({
      message: "Error retrieving teacher dashboard",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get all courses created by the teacher with detailed stats
 */
export const getTeacherCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const teacherId = auth.userId;

    // Get all courses created by this teacher
    const teacherCourses = await Course.scan({
      teacherId: teacherId,
    }).exec();

    if (teacherCourses.length === 0) {
      res.json({
        message: "No courses found",
        data: [],
      });
      return;
    }

    // Get detailed stats for each course
    const courseDetailsPromises = teacherCourses.map(async (course) => {
      // Get enrollment count
      const enrollmentCount = course.enrollments
        ? course.enrollments.length
        : 0;

      // Calculate total chapters count
      let totalChapters = 0;
      course.sections.forEach((section: any) => {
        if (section.chapters && Array.isArray(section.chapters)) {
          totalChapters += section.chapters.length;
        }
      });

      // Get basic course details
      return {
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        status: course.status,
        level: course.level,
        image: course.image,
        enrollmentCount,
        totalChapters,
        sections: course.sections.length,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      };
    });

    const courseDetails = await Promise.all(courseDetailsPromises);

    // Sort courses by creation date (newest first)
    courseDetails.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      message: "Teacher courses retrieved successfully",
      data: courseDetails,
    });
  } catch (error) {
    console.error("Error retrieving teacher courses:", error);
    res.status(500).json({
      message: "Error retrieving teacher courses",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get an overview of all students across all of the teacher's courses
 */
export const getTeacherStudentsOverview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const teacherId = auth.userId;

    // Get all courses created by this teacher
    const teacherCourses = await Course.scan({
      teacherId: teacherId,
    }).exec();

    if (teacherCourses.length === 0) {
      res.json({
        message: "No courses or students found",
        data: {
          students: [],
        },
      });
      return;
    }

    // Collect all unique student IDs across all courses
    const studentMap = new Map();

    // For each course, get enrollments and add to student map
    teacherCourses.forEach((course) => {
      if (course.enrollments && Array.isArray(course.enrollments)) {
        course.enrollments.forEach((enrollment: any) => {
          const studentId = enrollment.userId;

          if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
              studentId,
              courses: [],
              totalCourses: 0,
              name: "Unknown Student",
              email: "unknown",
              quizResults: [],
              totalQuizzesTaken: 0,
              averageQuizScore: 0,
            });
          }

          // Add this course to the student's courses
          studentMap.get(studentId).courses.push({
            courseId: course.courseId,
            title: course.title,
          });

          // Increment course count
          studentMap.get(studentId).totalCourses++;
        });
      }
    });

    // If no students found
    if (studentMap.size === 0) {
      res.json({
        message: "No students found",
        data: {
          students: [],
        },
      });
      return;
    }

    // Get student details from Clerk for all students
    const studentDetailsPromises = Array.from(studentMap.keys()).map(
      async (studentId) => {
        const student = studentMap.get(studentId);

        try {
          // Get student data from Clerk
          const clerkUser = await clerkClient.users.getUser(studentId);
          student.name =
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
            "Unknown Student";
          student.email =
            clerkUser.emailAddresses[0]?.emailAddress || "unknown";
        } catch (error) {
          console.error(`Failed to fetch user data for ${studentId}:`, error);
        }

        // Fetch progress data for this student across courses
        const progressPromises = student.courses.map(async (course: any) => {
          try {
            const progressRecords = await UserCourseProgress.scan({
              userId: studentId,
              courseId: course.courseId,
            }).exec();

            if (progressRecords.length > 0) {
              const progress = progressRecords[0];

              // Enhance course with progress data
              course.lastActivity = progress.updatedAt;
              course.completedChapters = progress.completedChapters
                ? progress.completedChapters.length
                : 0;

              // Add quiz results data if available
              if (progress.quizResults && progress.quizResults.length > 0) {
                course.quizResults = progress.quizResults.map((quiz: any) => ({
                  quizId: quiz.quizId,
                  score: quiz.score,
                  totalQuestions: quiz.totalQuestions,
                  completionDate: quiz.completionDate,
                  attemptCount: quiz.attemptCount,
                }));

                // Add quiz data to the course
                course.totalQuizzesTaken = progress.quizResults.length;
                course.averageQuizScore = progress.averageQuizScore || 0;

                // Add the quiz results to the student's overall quiz results
                student.quizResults.push(...course.quizResults);
                student.totalQuizzesTaken += course.totalQuizzesTaken;
              } else {
                course.quizResults = [];
                course.totalQuizzesTaken = 0;
                course.averageQuizScore = 0;
              }

              // Calculate completion percentage if we know the total chapters
              const matchingCourse = teacherCourses.find(
                (c) => c.courseId === course.courseId
              );
              if (matchingCourse) {
                let totalChapters = 0;
                matchingCourse.sections.forEach((section: any) => {
                  if (section.chapters && Array.isArray(section.chapters)) {
                    totalChapters += section.chapters.length;
                  }
                });

                course.totalChapters = totalChapters;
                course.completionPercentage =
                  totalChapters > 0
                    ? Math.round(
                        (course.completedChapters / totalChapters) * 100
                      )
                    : 0;
              }
            }

            return course;
          } catch (error) {
            console.error(
              `Error fetching progress for ${studentId} in course ${course.courseId}:`,
              error
            );
            return course;
          }
        });

        // Wait for all progress data
        student.courses = await Promise.all(progressPromises);

        // Sort courses by last activity (most recent first)
        student.courses.sort((a: any, b: any) => {
          if (a.lastActivity && b.lastActivity) {
            return (
              new Date(b.lastActivity).getTime() -
              new Date(a.lastActivity).getTime()
            );
          }
          return 0;
        });

        // Find most recent activity across all courses
        const mostRecentCourse = student.courses.find(
          (c: any) => c.lastActivity
        );
        if (mostRecentCourse) {
          student.lastActivity = mostRecentCourse.lastActivity;
        }

        // Calculate the student's average quiz score across all courses
        if (student.quizResults.length > 0) {
          const totalScore = student.quizResults.reduce(
            (sum: number, quiz: any) => sum + quiz.score,
            0
          );
          student.averageQuizScore = Math.round(
            totalScore / student.quizResults.length
          );
        }

        return student;
      }
    );

    // Get all student details
    const students = await Promise.all(studentDetailsPromises);

    // Sort students by total courses enrolled (highest first)
    students.sort((a, b) => b.totalCourses - a.totalCourses);

    res.json({
      message: "Teacher students overview retrieved successfully",
      data: {
        totalStudents: students.length,
        students,
      },
    });
  } catch (error) {
    console.error("Error retrieving teacher students overview:", error);
    res.status(500).json({
      message: "Error retrieving teacher students overview",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
