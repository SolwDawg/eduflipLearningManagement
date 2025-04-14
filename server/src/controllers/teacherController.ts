import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import Course from "../models/courseModel";
import UserCourseProgress from "../models/userCourseProgressModel";
import { clerkClient } from "@clerk/clerk-sdk-node";
import Quiz from "../models/quizModel";

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
                // Get all unique quiz IDs to fetch their titles
                const quizIds = progress.quizResults.map(
                  (quiz: any) => quiz.quizId
                );

                // Fetch quiz titles
                const quizzes = await Quiz.scan({
                  quizId: { in: quizIds },
                }).exec();

                // Create a map of quizId to quiz title for quick lookup
                const quizTitleMap = quizzes.reduce((map: any, quiz: any) => {
                  map[quiz.quizId] = quiz.title;
                  return map;
                }, {});

                course.quizResults = progress.quizResults.map((quiz: any) => ({
                  quizId: quiz.quizId,
                  score: quiz.score,
                  totalQuestions: quiz.totalQuestions,
                  completionDate: quiz.completionDate,
                  attemptCount: quiz.attemptCount,
                  quizTitle:
                    quizTitleMap[quiz.quizId] ||
                    `Bài kiểm tra ${quiz.quizId.substring(0, 8)}`,
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

/**
 * Get the exact enrollment count for a specific course
 */
export const getCourseEnrollmentCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const teacherId = auth.userId;

    // Verify that the course exists and the teacher owns it
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== teacherId) {
      res.status(403).json({
        message:
          "You do not have permission to access this course's enrollment data",
      });
      return;
    }

    // Calculate the exact enrollment count
    const enrollmentCount = course.enrollments ? course.enrollments.length : 0;

    // Return the enrollment count
    res.json({
      message: "Course enrollment count retrieved successfully",
      data: {
        courseId: course.courseId,
        title: course.title,
        enrollmentCount,
      },
    });
  } catch (error) {
    console.error("Error retrieving course enrollment count:", error);
    res.status(500).json({
      message: "Error retrieving course enrollment count",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get detailed enrollment information for a specific course
 */
export const getCourseEnrollmentDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const teacherId = auth.userId;

    // Verify that the course exists and the teacher owns it
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== teacherId) {
      res.status(403).json({
        message:
          "You do not have permission to access this course's enrollment data",
      });
      return;
    }

    // If there are no enrollments, return empty data
    if (!course.enrollments || course.enrollments.length === 0) {
      res.json({
        message: "No students enrolled in this course",
        data: {
          enrollmentCount: 0,
          enrolledStudents: [],
        },
      });
      return;
    }

    // Get detailed information for each enrolled student
    const enrolledStudentsPromises = course.enrollments.map(
      async (enrollment: any) => {
        try {
          // Get student details from Clerk
          const user = await clerkClient.users.getUser(enrollment.userId);

          // Get student progress
          const progress = await UserCourseProgress.get({
            userId: enrollment.userId,
            courseId,
          }).catch(() => null);

          return {
            userId: enrollment.userId,
            fullName:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Unknown",
            email:
              user.emailAddresses.length > 0
                ? user.emailAddresses[0].emailAddress
                : "N/A",
            enrollmentDate: progress ? progress.enrollmentDate : "N/A",
            overallProgress: progress ? progress.overallProgress : 0,
            lastAccessDate: progress ? progress.lastAccessedTimestamp : "N/A",
          };
        } catch (error) {
          console.error(
            `Error fetching details for user ${enrollment.userId}:`,
            error
          );
          // Return minimal info if we can't get the details
          return {
            userId: enrollment.userId,
            fullName: "Unknown User",
            email: "N/A",
            enrollmentDate: "N/A",
            overallProgress: 0,
            lastAccessDate: "N/A",
          };
        }
      }
    );

    const enrolledStudents = await Promise.all(enrolledStudentsPromises);

    res.json({
      message: "Course enrollment details retrieved successfully",
      data: {
        courseId: course.courseId,
        title: course.title,
        enrollmentCount: course.enrollments.length,
        enrolledStudents,
      },
    });
  } catch (error) {
    console.error("Error retrieving course enrollment details:", error);
    res.status(500).json({
      message: "Error retrieving course enrollment details",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get the count of students who have completed quizzes for a specific course
 */
export const getCourseQuizCompletionCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const teacherId = auth.userId;

    // Verify that the course exists and the teacher owns it
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== teacherId) {
      res.status(403).json({
        message: "You do not have permission to access this course's data",
      });
      return;
    }

    // If there are no enrollments, return zero counts
    if (!course.enrollments || course.enrollments.length === 0) {
      res.json({
        message: "No students enrolled in this course",
        data: {
          courseId: course.courseId,
          title: course.title,
          enrollmentCount: 0,
          quizCompletionCount: 0,
          completionRate: 0,
          quizData: [],
        },
      });
      return;
    }

    const enrollmentCount = course.enrollments.length;

    // Get all progress records for this course to check quiz completions
    const progressRecords = await UserCourseProgress.scan("courseId")
      .eq(courseId)
      .exec();

    // Count students who have completed at least one quiz
    const studentsWithQuizzes = progressRecords.filter(
      (record) => record.quizResults && record.quizResults.length > 0
    );

    const quizCompletionCount = studentsWithQuizzes.length;
    const completionRate =
      enrollmentCount > 0
        ? Math.round((quizCompletionCount / enrollmentCount) * 100)
        : 0;

    // Collect data on individual quizzes
    const quizMap = new Map();

    // Process each student's quiz results
    studentsWithQuizzes.forEach((record) => {
      if (record.quizResults && Array.isArray(record.quizResults)) {
        record.quizResults.forEach((quizResult: any) => {
          const { quizId, score, totalQuestions } = quizResult;

          if (!quizMap.has(quizId)) {
            quizMap.set(quizId, {
              quizId,
              title: `Quiz ${quizId.substring(0, 8)}`, // Will try to get real titles below
              completedCount: 0,
              totalScore: 0,
              attemptCount: 0,
            });
          }

          const quizData = quizMap.get(quizId);
          quizData.completedCount++;
          quizData.totalScore += score;
          quizData.attemptCount++;
        });
      }
    });

    // Try to get quiz titles
    try {
      const quizIds = Array.from(quizMap.keys());
      if (quizIds.length > 0) {
        const quizzes = await Quiz.scan("quizId").in(quizIds).exec();

        quizzes.forEach((quiz: any) => {
          if (quizMap.has(quiz.quizId)) {
            quizMap.get(quiz.quizId).title = quiz.title;
          }
        });
      }
    } catch (error) {
      console.error("Error fetching quiz titles:", error);
      // Continue without titles if there's an error
    }

    // Calculate average scores for each quiz
    const quizData = Array.from(quizMap.values()).map((quiz) => ({
      quizId: quiz.quizId,
      title: quiz.title,
      completedCount: quiz.completedCount,
      averageScore:
        quiz.attemptCount > 0
          ? Math.round((quiz.totalScore / quiz.attemptCount) * 10) / 10
          : 0,
    }));

    res.json({
      message: "Quiz completion count retrieved successfully",
      data: {
        courseId: course.courseId,
        title: course.title,
        enrollmentCount,
        quizCompletionCount,
        completionRate,
        quizData,
      },
    });
  } catch (error) {
    console.error("Error retrieving quiz completion count:", error);
    res.status(500).json({
      message: "Error retrieving quiz completion count",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get detailed information about students who have completed quizzes for a specific course
 */
export const getStudentsWithQuizCompletions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const teacherId = auth.userId;

    // Verify that the course exists and the teacher owns it
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== teacherId) {
      res.status(403).json({
        message: "You do not have permission to access this course's data",
      });
      return;
    }

    // If there are no enrollments, return empty data
    if (!course.enrollments || course.enrollments.length === 0) {
      res.json({
        message: "No students enrolled in this course",
        data: {
          courseId: course.courseId,
          title: course.title,
          enrollmentCount: 0,
          studentsWithQuizzes: [],
        },
      });
      return;
    }

    const enrollmentCount = course.enrollments.length;

    // Get all progress records for this course to check quiz completions
    const progressRecords = await UserCourseProgress.scan("courseId")
      .eq(courseId)
      .exec();

    // Filter students who have completed at least one quiz
    const studentsWithQuizzes = progressRecords.filter(
      (record) => record.quizResults && record.quizResults.length > 0
    );

    if (studentsWithQuizzes.length === 0) {
      res.json({
        message: "No students have completed quizzes in this course",
        data: {
          courseId: course.courseId,
          title: course.title,
          enrollmentCount,
          studentsWithQuizzes: [],
        },
      });
      return;
    }

    // Try to get all quiz titles in a single request
    const allQuizIds = new Set<string>();
    studentsWithQuizzes.forEach((record) => {
      if (record.quizResults && Array.isArray(record.quizResults)) {
        record.quizResults.forEach((result: any) => {
          allQuizIds.add(result.quizId);
        });
      }
    });

    const quizTitleMap: Record<string, string> = {};

    // Get quiz titles if there are any quiz IDs
    if (allQuizIds.size > 0) {
      try {
        const quizzes = await Quiz.scan("quizId")
          .in(Array.from(allQuizIds))
          .exec();

        quizzes.forEach((quiz: any) => {
          quizTitleMap[quiz.quizId] = quiz.title;
        });
      } catch (error) {
        console.error("Error fetching quiz titles:", error);
        // Continue without titles if there's an error
      }
    }

    // Get detailed information for each student with quizzes
    const studentDetailsPromises = studentsWithQuizzes.map(async (progress) => {
      try {
        // Get student details from Clerk
        const user = await clerkClient.users.getUser(progress.userId);

        // Process quiz results
        const completedQuizzes = (progress.quizResults || []).map(
          (result: any) => {
            return {
              quizId: result.quizId,
              title:
                quizTitleMap[result.quizId] ||
                `Quiz ${result.quizId.substring(0, 8)}`,
              score: result.score,
              totalQuestions: result.totalQuestions,
              completionDate: result.completionDate,
              attemptCount: result.attemptCount || 1,
            };
          }
        );

        // Calculate average quiz score
        const averageQuizScore =
          completedQuizzes.length > 0
            ? Math.round(
                completedQuizzes.reduce(
                  (sum: number, quiz: any) => sum + quiz.score,
                  0
                ) / completedQuizzes.length
              )
            : 0;

        return {
          userId: progress.userId,
          fullName:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            "Unknown",
          email:
            user.emailAddresses.length > 0
              ? user.emailAddresses[0].emailAddress
              : "N/A",
          completedQuizzes,
          averageQuizScore,
          totalQuizzesCompleted: completedQuizzes.length,
        };
      } catch (error) {
        console.error(
          `Error fetching details for user ${progress.userId}:`,
          error
        );
        // Return minimal info if we can't get the details
        return {
          userId: progress.userId,
          fullName: "Unknown User",
          email: "N/A",
          completedQuizzes: progress.quizResults || [],
          averageQuizScore: 0,
          totalQuizzesCompleted: (progress.quizResults || []).length,
        };
      }
    });

    const detailedStudents = await Promise.all(studentDetailsPromises);

    // Sort students by number of completed quizzes (highest first)
    detailedStudents.sort(
      (a, b) => b.totalQuizzesCompleted - a.totalQuizzesCompleted
    );

    res.json({
      message: "Students with quiz completions retrieved successfully",
      data: {
        courseId: course.courseId,
        title: course.title,
        enrollmentCount,
        studentsWithQuizzes: detailedStudents,
      },
    });
  } catch (error) {
    console.error("Error retrieving students with quiz completions:", error);
    res.status(500).json({
      message: "Error retrieving students with quiz completions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
