import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import UserCourseProgress from "../models/userCourseProgressModel";
import Course from "../models/courseModel";
import { calculateOverallProgress } from "../utils/utils";
import { mergeSections } from "../utils/utils";
import { clerkClient } from "@clerk/clerk-sdk-node";

export const getUserEnrolledCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  try {
    const enrolledCourses = await UserCourseProgress.query("userId")
      .eq(userId)
      .exec();

    // If no enrolled courses found, return empty array
    if (!enrolledCourses || enrolledCourses.length === 0) {
      res.json({
        message: "No enrolled courses found",
        data: [],
      });
      return;
    }

    const courseIds = enrolledCourses.map((item: any) => item.courseId);

    // If no courseIds, return empty array
    if (!courseIds || courseIds.length === 0) {
      res.json({
        message: "No course IDs found",
        data: [],
      });
      return;
    }

    try {
      const courses = await Course.batchGet(courseIds);
      res.json({
        message: "Enrolled courses retrieved successfully",
        data: courses,
      });
    } catch (batchError) {
      console.error("Error in Course.batchGet:", batchError);
      // If batch get fails, try to get courses one by one
      const coursesPromises = courseIds.map((id) =>
        Course.get(id).catch(() => null)
      );
      const coursesResults = await Promise.all(coursesPromises);
      const validCourses = coursesResults.filter((course) => course !== null);

      res.json({
        message: "Enrolled courses retrieved with fallback method",
        data: validCourses,
      });
    }
  } catch (error) {
    console.error("Error retrieving enrolled courses:", error);
    res.status(500).json({
      message: "Error retrieving enrolled courses",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;

  try {
    const progress = await UserCourseProgress.get({ userId, courseId });
    if (!progress) {
      res
        .status(404)
        .json({ message: "Course progress not found for this user" });
      return;
    }
    res.json({
      message: "Course progress retrieved successfully",
      data: progress,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving user course progress", error });
  }
};

export const updateUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;
  const progressData = req.body;

  try {
    let progress = await UserCourseProgress.get({ userId, courseId });

    if (!progress) {
      // If no progress exists, create initial progress
      progress = new UserCourseProgress({
        userId,
        courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        sections: progressData.sections || [],
        lastAccessedTimestamp: new Date().toISOString(),
        completedChapters: [],
      });
    } else {
      // Merge existing progress with new progress data
      progress.sections = mergeSections(
        progress.sections,
        progressData.sections || []
      );
      progress.lastAccessedTimestamp = new Date().toISOString();
      progress.overallProgress = calculateOverallProgress(progress.sections);

      // Update completedChapters array
      if (progressData.sections && progressData.sections.length > 0) {
        const completedChapters = new Set(progress.completedChapters || []);

        // Check for newly completed chapters
        progressData.sections.forEach((section: any) => {
          if (section.chapters && section.chapters.length > 0) {
            section.chapters.forEach((chapter: any) => {
              if (chapter.completed) {
                completedChapters.add(chapter.chapterId);
              } else {
                completedChapters.delete(chapter.chapterId);
              }
            });
          }
        });

        progress.completedChapters = Array.from(completedChapters);
      }
    }

    await progress.save();

    res.json({
      message: "",
      data: progress,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      message: "Error updating user course progress",
      error,
    });
  }
};

export const enrollCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;

  try {
    // Check if the course exists
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Check if the user has a progress record already
    const existingProgress = await UserCourseProgress.get({
      userId,
      courseId,
    }).catch(() => null);

    if (existingProgress) {
      // User already has a progress record
      res.json({
        message: "User is already enrolled in this course",
        data: existingProgress,
      });
      return;
    }

    // Check enrollments list on the course
    const isEnrolledInCourse =
      course.enrollments &&
      course.enrollments.some(
        (enrollment: any) => enrollment.userId === userId
      );

    // Create new course progress
    const initialProgress = new UserCourseProgress({
      userId,
      courseId,
      enrollmentDate: new Date().toISOString(),
      overallProgress: 0,
      sections: course.sections.map((section: any) => ({
        sectionId: section.sectionId,
        chapters: section.chapters.map((chapter: any) => ({
          chapterId: chapter.chapterId,
          completed: false,
        })),
      })),
      lastAccessedTimestamp: new Date().toISOString(),
      completedChapters: [],
    });

    await initialProgress.save();

    // Only update course enrollments if user isn't already in the list
    if (!isEnrolledInCourse) {
      await Course.update(
        { courseId },
        {
          $ADD: {
            enrollments: [{ userId }],
          },
        }
      );
    }

    res.json({
      message: "Successfully enrolled in course",
      data: initialProgress,
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({
      message: "Error enrolling in course",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getMonthlyLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get current month data
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

    // Get all user progress data
    const allUserProgress = await UserCourseProgress.scan().exec();

    // Group by user
    const userMap = new Map();

    for (const progress of allUserProgress) {
      const userId = progress.userId;

      // Skip entries with undefined userId
      if (!userId) continue;

      // Calculate attendance score based on lastAccessedTimestamp
      // Only consider access within current month
      let attendanceScore = 0;
      if (progress.lastAccessedTimestamp) {
        const lastAccessed = new Date(progress.lastAccessedTimestamp);
        if (lastAccessed >= firstDayOfMonth) {
          attendanceScore = 1; // Count 1 point per course accessed this month
        }
      }

      // Calculate score based on completed chapters
      const completionScore = (progress.completedChapters?.length || 0) * 2; // 2 points per completed chapter

      // Calculate overall progress score
      const progressScore = Math.round((progress.overallProgress || 0) * 10); // 0-10 points based on progress percentage

      // Total score for this course
      const courseScore = attendanceScore + completionScore + progressScore;

      // Add to user's total score
      if (userMap.has(userId)) {
        const userData = userMap.get(userId);
        userData.totalScore += courseScore;
        userData.coursesAccessed += attendanceScore > 0 ? 1 : 0;
        userData.chaptersCompleted += progress.completedChapters?.length || 0;
      } else {
        userMap.set(userId, {
          userId,
          totalScore: courseScore,
          coursesAccessed: attendanceScore > 0 ? 1 : 0,
          chaptersCompleted: progress.completedChapters?.length || 0,
        });
      }
    }

    // Convert map to array and sort by total score
    const leaderboardArray = Array.from(userMap.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);

    // Get user details from user IDs (assuming Clerk integration)
    // Normally we would fetch full details, but for simplicity we'll just use IDs
    // In a real app, you would likely make API calls to Clerk or your user service
    // to get names, avatars, etc.

    const leaderboard = leaderboardArray.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      totalScore: entry.totalScore,
      coursesAccessed: entry.coursesAccessed,
      chaptersCompleted: entry.chaptersCompleted,
      // These fields would typically come from your user service
      name: `Student ${index + 1}`,
      avatarUrl: `https://ui-avatars.com/api/?name=S${
        index + 1
      }&background=random`,
    }));

    res.json({
      message: "Monthly leaderboard retrieved successfully",
      data: leaderboard,
      month: today.toLocaleString("default", { month: "long" }),
      year: currentYear,
    });
  } catch (error) {
    console.error("Error retrieving leaderboard:", error);
    res.status(500).json({
      message: "Error retrieving monthly leaderboard",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const trackMaterialAccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId, chapterId } = req.body;

  try {
    // Get the current progress
    const progress = await UserCourseProgress.get({
      userId,
      courseId,
    });

    if (!progress) {
      res.status(404).json({ message: "Progress record not found" });
      return;
    }

    // Find the chapter and update its access count
    let found = false;
    if (progress.sections) {
      for (const section of progress.sections) {
        if (section.chapters) {
          for (const chapter of section.chapters) {
            if (chapter.chapterId === chapterId) {
              chapter.accessCount = (chapter.accessCount || 0) + 1;
              chapter.lastAccessDate = new Date().toISOString();
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }
    }

    // Update total material access count
    progress.totalMaterialAccessCount =
      (progress.totalMaterialAccessCount || 0) + 1;
    progress.lastAccessedTimestamp = new Date().toISOString();

    // Save the updated progress
    await progress.save();

    res.status(200).json({
      message: "Material access tracked successfully",
      data: { accessCount: progress.totalMaterialAccessCount },
    });
  } catch (error) {
    console.error("Error tracking material access:", error);
    res.status(500).json({ message: "Failed to track material access" });
  }
};

export const trackQuizResult = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId, quizId, score, totalQuestions } = req.body;

  try {
    // Get the current progress
    const progress = await UserCourseProgress.get({
      userId,
      courseId,
    });

    if (!progress) {
      res.status(404).json({ message: "Progress record not found" });
      return;
    }

    // Initialize quizResults array if it doesn't exist
    if (!progress.quizResults) {
      progress.quizResults = [];
    }

    // Check if this quiz has been attempted before
    const existingQuizIndex = progress.quizResults.findIndex(
      (quiz: any) => quiz.quizId === quizId
    );

    if (existingQuizIndex >= 0) {
      // Update existing quiz result
      progress.quizResults[existingQuizIndex].score = score;
      progress.quizResults[existingQuizIndex].attemptCount += 1;
      progress.quizResults[existingQuizIndex].completionDate =
        new Date().toISOString();
    } else {
      // Add new quiz result
      progress.quizResults.push({
        quizId,
        score,
        totalQuestions,
        completionDate: new Date().toISOString(),
        attemptCount: 1,
      });
    }

    // Calculate average quiz score
    const totalScore = progress.quizResults.reduce(
      (sum: number, quiz: any) => sum + quiz.score,
      0
    );
    progress.averageQuizScore = totalScore / progress.quizResults.length;

    // Save the updated progress
    await progress.save();

    res.status(200).json({
      message: "Quiz result tracked successfully",
      data: {
        averageScore: progress.averageQuizScore,
        quizResults: progress.quizResults,
      },
    });
  } catch (error) {
    console.error("Error tracking quiz result:", error);
    res.status(500).json({ message: "Failed to track quiz result" });
  }
};

export const trackDiscussionActivity = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId, discussionId } = req.body;

  try {
    // Get the current progress
    const progress = await UserCourseProgress.get({
      userId,
      courseId,
    });

    if (!progress) {
      res.status(404).json({ message: "Progress record not found" });
      return;
    }

    // Initialize discussionActivity array if it doesn't exist
    if (!progress.discussionActivity) {
      progress.discussionActivity = [];
    }

    // Check if this discussion has activity before
    const existingDiscussionIndex = progress.discussionActivity.findIndex(
      (discussion: any) => discussion.discussionId === discussionId
    );

    if (existingDiscussionIndex >= 0) {
      // Update existing discussion activity
      progress.discussionActivity[existingDiscussionIndex].postsCount += 1;
      progress.discussionActivity[existingDiscussionIndex].lastActivityDate =
        new Date().toISOString();
    } else {
      // Add new discussion activity
      progress.discussionActivity.push({
        discussionId,
        postsCount: 1,
        lastActivityDate: new Date().toISOString(),
      });
    }

    // Calculate participation level
    const totalPosts = progress.discussionActivity.reduce(
      (sum: number, discussion: any) => sum + discussion.postsCount,
      0
    );

    if (totalPosts >= 20) {
      progress.participationLevel = "High";
    } else if (totalPosts >= 10) {
      progress.participationLevel = "Medium";
    } else {
      progress.participationLevel = "Low";
    }

    // Save the updated progress
    await progress.save();

    res.status(200).json({
      message: "Discussion activity tracked successfully",
      data: {
        participationLevel: progress.participationLevel,
        totalPosts,
      },
    });
  } catch (error) {
    console.error("Error tracking discussion activity:", error);
    res.status(500).json({ message: "Failed to track discussion activity" });
  }
};

export const getStudentProgressAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;

  try {
    // Get all progress records for this course
    const progressRecords = await UserCourseProgress.query("courseId")
      .eq(courseId)
      .exec();

    if (!progressRecords || progressRecords.length === 0) {
      res
        .status(404)
        .json({ message: "No student progress records found for this course" });
      return;
    }

    // Compile analytics
    const analytics = {
      totalStudents: progressRecords.length,
      averageProgress: 0,
      materialAccessData: {
        totalAccesses: 0,
        averageAccessesPerStudent: 0,
        studentsWithNoAccess: 0,
      },
      quizData: {
        averageScore: 0,
        studentsWithNoQuizzes: 0,
        completionRate: 0,
      },
      discussionData: {
        totalPosts: 0,
        averagePostsPerStudent: 0,
        participationLevels: {
          high: 0,
          medium: 0,
          low: 0,
          none: 0,
        },
      },
      studentDetails: progressRecords.map((record: any) => ({
        userId: record.userId,
        progress: record.overallProgress,
        materialAccesses: record.totalMaterialAccessCount || 0,
        quizAverage: record.averageQuizScore || 0,
        participationLevel: record.participationLevel || "None",
        lastAccessed: record.lastAccessedTimestamp,
      })),
    };

    // Calculate totals and averages
    let totalProgress = 0;
    let totalMaterialAccesses = 0;
    let totalQuizScores = 0;
    let studentsWithQuizzes = 0;
    let totalPosts = 0;

    progressRecords.forEach((record: any) => {
      totalProgress += record.overallProgress || 0;
      totalMaterialAccesses += record.totalMaterialAccessCount || 0;

      if (record.averageQuizScore) {
        totalQuizScores += record.averageQuizScore;
        studentsWithQuizzes++;
      }

      if (!record.totalMaterialAccessCount) {
        analytics.materialAccessData.studentsWithNoAccess++;
      }

      if (!record.quizResults || record.quizResults.length === 0) {
        analytics.quizData.studentsWithNoQuizzes++;
      }

      if (record.participationLevel === "High") {
        analytics.discussionData.participationLevels.high++;
      } else if (record.participationLevel === "Medium") {
        analytics.discussionData.participationLevels.medium++;
      } else if (record.participationLevel === "Low") {
        analytics.discussionData.participationLevels.low++;
      } else {
        analytics.discussionData.participationLevels.none++;
      }

      if (record.discussionActivity) {
        record.discussionActivity.forEach((discussion: any) => {
          totalPosts += discussion.postsCount || 0;
        });
      }
    });

    // Set calculated values
    analytics.averageProgress = totalProgress / progressRecords.length;
    analytics.materialAccessData.totalAccesses = totalMaterialAccesses;
    analytics.materialAccessData.averageAccessesPerStudent =
      totalMaterialAccesses / progressRecords.length;
    analytics.quizData.averageScore = studentsWithQuizzes
      ? totalQuizScores / studentsWithQuizzes
      : 0;
    analytics.quizData.completionRate =
      ((progressRecords.length - analytics.quizData.studentsWithNoQuizzes) /
        progressRecords.length) *
      100;
    analytics.discussionData.totalPosts = totalPosts;
    analytics.discussionData.averagePostsPerStudent =
      totalPosts / progressRecords.length;

    res.status(200).json({
      message: "Student progress analytics retrieved successfully",
      data: analytics,
    });
  } catch (error) {
    console.error("Error retrieving student progress analytics:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve student progress analytics" });
  }
};

export const getStudentProgressDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, userId } = req.params;

  try {
    // Get the user's progress for this course
    const progress = await UserCourseProgress.get({
      userId,
      courseId,
    });

    if (!progress) {
      res.status(404).json({ message: "Student progress not found" });
      return;
    }

    // For this implementation, use the course model but not user/quiz/discussion models directly
    // Instead, use the data that's already in the progress record

    // Get course information to get chapter names and section details
    const course = await Course.get({ id: courseId });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Map sections and chapters with additional information
    const sectionsWithDetails = course.sections.map((section: any) => {
      // Find user's progress for this section's chapters
      const sectionProgress = progress.sections?.find(
        (s: any) => s.sectionId === section.id
      );

      // Map chapters with additional information
      const chaptersWithDetails = section.chapters.map((chapter: any) => {
        // Find user's progress for this chapter
        const chapterProgress = sectionProgress?.chapters?.find(
          (c: any) => c.chapterId === chapter.id
        ) || { completed: false, accessCount: 0 };

        return {
          chapterId: chapter.id,
          title: chapter.title,
          completed: chapterProgress.completed || false,
          accessCount: chapterProgress.accessCount || 0,
          lastAccessDate: chapterProgress.lastAccessDate,
        };
      });

      // Calculate section progress based on completed chapters
      const completedChapters = chaptersWithDetails.filter(
        (chapter: { completed: boolean }) => chapter.completed
      ).length;
      const sectionProgressPercent =
        chaptersWithDetails.length > 0
          ? (completedChapters / chaptersWithDetails.length) * 100
          : 0;

      return {
        sectionId: section.id,
        title: section.title,
        progress: sectionProgressPercent,
        chapters: chaptersWithDetails,
      };
    });

    // Create simplified quiz results (without fetching quiz details)
    const quizResultsWithDetails =
      progress.quizResults?.map((result: any) => {
        return {
          quizId: result.quizId,
          title: `Quiz ${result.quizId}`, // Use a placeholder title
          score: result.score,
          totalQuestions: result.totalQuestions,
          attemptCount: result.attemptCount || 1,
          attemptDate: result.completionDate,
        };
      }) || [];

    // Create simplified discussion activity (without fetching discussion details)
    const discussionActivityWithDetails =
      progress.discussionActivity?.map((activity: any) => {
        return {
          discussionId: activity.discussionId,
          title: `Discussion ${activity.discussionId}`, // Use a placeholder title
          postsCount: activity.postsCount,
          lastActivityDate: activity.lastActivityDate,
        };
      }) || [];

    // Prepare detailed student progress response
    const studentDetails = {
      userId: userId,
      name: "Student", // Use a placeholder name
      email: "student@example.com", // Use a placeholder email
      profileImage: "", // Use a placeholder image
      enrollmentDate: progress.enrollmentDate,
      lastAccessDate: progress.lastAccessedTimestamp,
      overallProgress: progress.overallProgress || 0,
      sections: sectionsWithDetails,
      totalMaterialAccessCount: progress.totalMaterialAccessCount || 0,
      quizResults: quizResultsWithDetails,
      averageQuizScore: progress.averageQuizScore || 0,
      discussionActivity: discussionActivityWithDetails,
      participationLevel: progress.participationLevel || "None",
    };

    res.status(200).json({
      message: "Student progress details fetched successfully",
      data: studentDetails,
    });
  } catch (error) {
    console.error("Error fetching student progress details:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch student progress details" });
  }
};

export const getUserQuizResults = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;

  try {
    console.log(`Fetching quiz results for user ${userId}`);

    // Get all progress records for this user
    const progressRecords = await UserCourseProgress.query("userId")
      .eq(userId)
      .exec();

    console.log(
      `Found ${
        progressRecords?.length || 0
      } progress records for user ${userId}`
    );

    if (!progressRecords || progressRecords.length === 0) {
      console.log(
        `No progress records found for user ${userId}, returning empty array`
      );
      res.status(200).json({
        message: "No progress records found for this user",
        data: [],
      });
      return;
    }

    // Compile all quiz results from all courses
    const allQuizResults = progressRecords.reduce(
      (results: any[], record: any) => {
        if (record.quizResults && record.quizResults.length > 0) {
          // Add course information to each quiz result
          const quizResultsWithCourse = record.quizResults.map(
            (result: any) => ({
              ...result,
              courseId: record.courseId,
            })
          );
          results.push(...quizResultsWithCourse);
        }
        return results;
      },
      []
    );

    console.log(
      `Compiled ${allQuizResults.length} quiz results for user ${userId}`
    );

    // Sort by completion date (most recent first)
    allQuizResults.sort((a: any, b: any) => {
      return (
        new Date(b.completionDate).getTime() -
        new Date(a.completionDate).getTime()
      );
    });

    res.status(200).json({
      message: "User quiz results retrieved successfully",
      data: allQuizResults,
    });
  } catch (error) {
    console.error("Error retrieving user quiz results:", error);
    res.status(500).json({
      message: "Failed to retrieve user quiz results",
      error: error instanceof Error ? error.message : String(error),
      data: [],
    });
  }
};

export const getCourseQuizResults = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;

  try {
    // Get all progress records for this course
    const progressRecords = await UserCourseProgress.query("courseId")
      .eq(courseId)
      .exec();

    if (!progressRecords || progressRecords.length === 0) {
      res.status(404).json({
        message: "No progress records found for this course",
      });
      return;
    }

    // Compile all quiz results from all students in this course
    const allStudentQuizResults = progressRecords.reduce(
      (results: any[], record: any) => {
        if (record.quizResults && record.quizResults.length > 0) {
          // Add user information to each quiz result
          const quizResultsWithUser = record.quizResults.map((result: any) => ({
            ...result,
            userId: record.userId,
          }));
          results.push(...quizResultsWithUser);
        }
        return results;
      },
      []
    );

    // Group by quizId
    const resultsByQuiz = allStudentQuizResults.reduce(
      (grouped: { [key: string]: any[] }, result: any) => {
        const quizId = result.quizId;
        if (!grouped[quizId]) {
          grouped[quizId] = [];
        }
        grouped[quizId].push(result);
        return grouped;
      },
      {}
    );

    res.status(200).json({
      message: "Course quiz results retrieved successfully",
      data: {
        allResults: allStudentQuizResults,
        byQuiz: resultsByQuiz,
      },
    });
  } catch (error) {
    console.error("Error retrieving course quiz results:", error);
    res.status(500).json({ message: "Failed to retrieve course quiz results" });
  }
};

// New function to get all students enrolled in a course
export const getEnrolledStudentsWithProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { teacherId } = req.query;

  try {
    // First, verify that the teacher owns this course
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== teacherId) {
      res.status(403).json({
        message:
          "You do not have permission to access this course's student data",
      });
      return;
    }

    // Get all progress records for this course
    const progressRecords = await UserCourseProgress.scan("courseId")
      .eq(courseId)
      .exec();

    if (!progressRecords || progressRecords.length === 0) {
      res.json({
        message: "No students enrolled in this course",
        data: [],
      });
      return;
    }

    // Fetch user details from Clerk for each student
    // Note: In a real implementation, you might want to batch these requests
    // or implement caching for better performance
    const studentData = await Promise.all(
      progressRecords.map(async (record: any) => {
        try {
          // Get user information from Clerk
          const user = await clerkClient.users.getUser(record.userId);

          return {
            userId: record.userId,
            fullName: `${user.firstName} ${user.lastName}`,
            email: user.emailAddresses[0]?.emailAddress || "N/A",
            enrollmentDate: record.enrollmentDate,
            overallProgress: record.overallProgress,
            lastAccessedTimestamp: record.lastAccessedTimestamp,
            completedChapters: record.completedChapters?.length || 0,
            totalChapters: calculateTotalChapters(course),
            quizResults: record.quizResults || [],
            averageQuizScore: record.averageQuizScore || 0,
          };
        } catch (error) {
          console.error(`Error fetching user ${record.userId}:`, error);
          return {
            userId: record.userId,
            fullName: "Unknown User",
            email: "N/A",
            enrollmentDate: record.enrollmentDate,
            overallProgress: record.overallProgress,
            lastAccessedTimestamp: record.lastAccessedTimestamp,
            completedChapters: record.completedChapters?.length || 0,
            totalChapters: calculateTotalChapters(course),
            quizResults: record.quizResults || [],
            averageQuizScore: record.averageQuizScore || 0,
          };
        }
      })
    );

    res.json({
      message: "Students retrieved successfully",
      data: studentData,
    });
  } catch (error) {
    console.error("Error retrieving enrolled students:", error);
    res.status(500).json({
      message: "Error retrieving enrolled students",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Helper function to calculate total chapters in a course
function calculateTotalChapters(course: any): number {
  if (!course.sections) return 0;

  return course.sections.reduce((total: number, section: any) => {
    return total + (section.chapters?.length || 0);
  }, 0);
}

// New function to get all students' progress across all courses for a teacher
export const getAllStudentsProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { teacherId } = req.query;

  try {
    if (!teacherId) {
      res.status(400).json({ message: "Teacher ID is required" });
      return;
    }

    // First, get all courses owned by this teacher
    const teacherCourses = await Course.scan("teacherId").eq(teacherId).exec();

    if (!teacherCourses || teacherCourses.length === 0) {
      res.json({
        message: "No courses found for this teacher",
        data: {
          courses: [],
          students: [],
        },
      });
      return;
    }

    // Get course IDs
    const courseIds = teacherCourses.map((course: any) => course.courseId);

    // Initialize student map to combine data from multiple courses
    const studentMap = new Map();

    // For each course, get all student progress records
    for (const course of teacherCourses) {
      const progressRecords = await UserCourseProgress.scan("courseId")
        .eq(course.courseId)
        .exec();

      if (progressRecords && progressRecords.length > 0) {
        // Process each student's progress in this course
        for (const record of progressRecords) {
          const userId = record.userId;

          // Initialize or update student data
          if (!studentMap.has(userId)) {
            // First time seeing this student
            studentMap.set(userId, {
              userId,
              courses: [
                {
                  courseId: course.courseId,
                  courseTitle: course.title,
                  enrollmentDate: record.enrollmentDate,
                  progress: record.overallProgress || 0,
                  completedChapters: record.completedChapters?.length || 0,
                  totalChapters: calculateTotalChapters(course),
                  lastAccessed: record.lastAccessedTimestamp,
                  averageQuizScore: record.averageQuizScore || 0,
                },
              ],
              totalCourses: 1,
              averageProgress: record.overallProgress || 0,
              lastActivity: record.lastAccessedTimestamp,
            });
          } else {
            // Update existing student data
            const studentData = studentMap.get(userId);
            studentData.courses.push({
              courseId: course.courseId,
              courseTitle: course.title,
              enrollmentDate: record.enrollmentDate,
              progress: record.overallProgress || 0,
              completedChapters: record.completedChapters?.length || 0,
              totalChapters: calculateTotalChapters(course),
              lastAccessed: record.lastAccessedTimestamp,
              averageQuizScore: record.averageQuizScore || 0,
            });

            // Update aggregate data
            studentData.totalCourses += 1;
            const totalProgress = studentData.courses.reduce(
              (sum: number, course: any) => sum + course.progress,
              0
            );
            studentData.averageProgress =
              totalProgress / studentData.courses.length;

            // Update last activity if this is more recent
            if (
              new Date(record.lastAccessedTimestamp) >
              new Date(studentData.lastActivity)
            ) {
              studentData.lastActivity = record.lastAccessedTimestamp;
            }
          }
        }
      }
    }

    // For each student, get their profile information from Clerk
    const studentsWithProfiles = await Promise.all(
      Array.from(studentMap.values()).map(async (student: any) => {
        try {
          // Get user information from Clerk
          const user = await clerkClient.users.getUser(student.userId);

          return {
            ...student,
            fullName: `${user.firstName} ${user.lastName}`,
            email: user.emailAddresses[0]?.emailAddress || "N/A",
            avatarUrl: user.imageUrl,
          };
        } catch (error) {
          console.error(`Error fetching user ${student.userId}:`, error);
          return {
            ...student,
            fullName: "Unknown User",
            email: "N/A",
            avatarUrl: null,
          };
        }
      })
    );

    res.json({
      message: "Student progress data retrieved successfully",
      data: {
        courses: teacherCourses.map((course: any) => ({
          courseId: course.courseId,
          title: course.title,
          totalStudents: course.enrollments?.length || 0,
        })),
        students: studentsWithProfiles,
      },
    });
  } catch (error) {
    console.error("Error retrieving all students progress:", error);
    res.status(500).json({
      message: "Error retrieving all students progress",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
