import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import Course from "../models/courseModel";
import UserCourseProgress from "../models/userCourseProgressModel";

// Get course progress statistics for all students
export const getCourseProgressStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  try {
    // Verify the course exists and user is the teacher
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to view this data" });
      return;
    }

    // Get all students' progress for this course
    const allProgress = await UserCourseProgress.scan()
      .filter("courseId")
      .eq(courseId)
      .exec();

    if (!allProgress || allProgress.length === 0) {
      res.json({
        message: "No student progress data found",
        data: {
          enrolledStudents: 0,
          averageProgress: 0,
          completionRate: 0,
          accessFrequency: {},
          chapterCompletionStats: [],
          discussionStats: {
            totalComments: 0,
            activeUsers: 0,
            mostDiscussedChapters: [],
          },
        },
      });
      return;
    }

    // Calculate enrollment and completion statistics
    const enrolledStudents = allProgress.length;
    const averageProgress =
      allProgress.reduce((sum, record) => sum + record.overallProgress, 0) /
      enrolledStudents;
    const completedStudents = allProgress.filter(
      (record) => record.overallProgress === 100
    ).length;
    const completionRate = (completedStudents / enrolledStudents) * 100;

    // Analyze access frequency (aggregated by day)
    const lastAccessDates = allProgress.map((record) => {
      const date = new Date(record.lastAccessedTimestamp);
      return date.toISOString().split("T")[0]; // Get just the date part
    });

    const accessFrequency: Record<string, number> = {};
    lastAccessDates.forEach((date) => {
      accessFrequency[date] = (accessFrequency[date] || 0) + 1;
    });

    // Get chapter completion statistics
    const chapterCompletionStats = course.sections.flatMap((section: any) => {
      return section.chapters.map((chapter: any) => {
        // Calculate completion rate for this chapter
        const completedCount = allProgress.filter((progress) => {
          const sectionProgress = progress.sections.find(
            (s: any) => s.sectionId === section.sectionId
          );

          const chapterProgress = sectionProgress?.chapters.find(
            (c: any) => c.chapterId === chapter.chapterId && c.completed
          );

          return !!chapterProgress;
        }).length;

        const completionRate =
          allProgress.length > 0
            ? (completedCount / allProgress.length) * 100
            : 0;

        return {
          chapterId: chapter.chapterId,
          title: chapter.title,
          type: chapter.type,
          completedCount,
          totalStudents: allProgress.length,
          completionRate,
        };
      });
    });

    // Analyze discussion activity
    const chapterCommentCounts: Record<
      string,
      { chapterId: string; title: string; commentCount: number }
    > = {};
    const uniqueCommenters = new Set();
    let totalComments = 0;

    course.sections.forEach((section: any) => {
      section.chapters.forEach((chapter: any) => {
        const comments = chapter.comments || [];
        const discussionForum = chapter.discussionForum || [];

        // Count comments and discussion posts
        const commentCount =
          comments.length +
          discussionForum.length +
          discussionForum.reduce(
            (sum: number, post: any) => sum + (post.replies?.length || 0),
            0
          );

        if (commentCount > 0) {
          chapterCommentCounts[chapter.chapterId] = {
            chapterId: chapter.chapterId,
            title: chapter.title,
            commentCount,
          };

          totalComments += commentCount;

          // Track unique users participating in discussions
          comments.forEach((comment: any) =>
            uniqueCommenters.add(comment.userId)
          );
          discussionForum.forEach((post: any) => {
            uniqueCommenters.add(post.userId);
            (post.replies || []).forEach((reply: any) =>
              uniqueCommenters.add(reply.userId)
            );
          });
        }
      });
    });

    // Get most discussed chapters
    const mostDiscussedChapters = Object.values(chapterCommentCounts)
      .sort((a, b) => b.commentCount - a.commentCount)
      .slice(0, 5);

    res.json({
      message: "Course progress statistics retrieved successfully",
      data: {
        enrolledStudents,
        averageProgress,
        completionRate,
        accessFrequency,
        chapterCompletionStats,
        discussionStats: {
          totalComments,
          activeUsers: uniqueCommenters.size,
          mostDiscussedChapters,
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving progress statistics", error });
  }
};

// Get detailed progress for a specific student
export const getStudentProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, studentId } = req.params;
  const { userId } = getAuth(req);

  try {
    // Verify the course exists and user is the teacher
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to view this data" });
      return;
    }

    // Get student's progress
    const studentProgress = await UserCourseProgress.get({
      userId: studentId,
      courseId,
    });

    if (!studentProgress) {
      res.status(404).json({ message: "Student progress data not found" });
      return;
    }

    // Calculate additional statistics
    const chapterCompletionStats = course.sections.flatMap((section: any) => {
      return section.chapters.map((chapter: any) => {
        const sectionProgress = studentProgress.sections.find(
          (s: any) => s.sectionId === section.sectionId
        );

        const chapterProgress = sectionProgress?.chapters.find(
          (c: any) => c.chapterId === chapter.chapterId
        );

        return {
          chapterId: chapter.chapterId,
          title: chapter.title,
          type: chapter.type,
          completed: chapterProgress?.completed || false,
          timeSpent: chapterProgress?.timeSpent || 0,
          lastAccessed: chapterProgress?.lastAccessed || null,
        };
      });
    });

    // Get discussion activity
    const discussionActivity = {
      totalPosts: 0,
      totalReplies: 0,
      lastActivity: null,
      recentPosts: [] as any[],
    };

    // Count posts and replies by this student across all chapters
    course.sections.forEach((section: any) => {
      section.chapters.forEach((chapter: any) => {
        const discussionForum = chapter.discussionForum || [];

        // Count posts by this student
        discussionForum.forEach((post: any) => {
          if (post.userId === studentId) {
            discussionActivity.totalPosts++;

            // Track most recent activity
            if (
              !discussionActivity.lastActivity ||
              new Date(post.timestamp) >
                new Date(discussionActivity.lastActivity)
            ) {
              discussionActivity.lastActivity = post.timestamp;
            }

            // Track recent posts
            discussionActivity.recentPosts.push({
              chapterId: chapter.chapterId,
              chapterTitle: chapter.title,
              postId: post.postId,
              content: post.content,
              timestamp: post.timestamp,
            });
          }

          // Count replies by this student
          (post.replies || []).forEach((reply: any) => {
            if (reply.userId === studentId) {
              discussionActivity.totalReplies++;

              if (
                !discussionActivity.lastActivity ||
                new Date(reply.timestamp) >
                  new Date(discussionActivity.lastActivity)
              ) {
                discussionActivity.lastActivity = reply.timestamp;
              }
            }
          });
        });
      });
    });

    // Sort recent posts by timestamp (newest first) and limit to 5
    discussionActivity.recentPosts
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 5);

    res.json({
      message: "Student progress data retrieved successfully",
      data: {
        studentId,
        enrollmentDate: studentProgress.enrollmentDate,
        overallProgress: studentProgress.overallProgress,
        lastAccessed: studentProgress.lastAccessedTimestamp,
        chapterCompletionStats,
        discussionActivity,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving student progress", error });
  }
};
