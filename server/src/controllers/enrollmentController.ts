import { Request, Response } from "express";
import Course from "../models/courseModel";
import UserCourseProgress from "../models/userCourseProgressModel";
import { v4 as uuidv4 } from "uuid";

export const listEnrollments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;

  try {
    // Get all courses where the user is enrolled
    const courses = await Course.scan().exec();
    const enrolledCourses = courses.filter((course: any) => {
      return (
        course.enrollments &&
        course.enrollments.some(
          (enrollment: any) => enrollment.userId === userId
        )
      );
    });

    res.json({
      message: "Enrollments retrieved successfully",
      data: enrolledCourses,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving enrollments", error });
  }
};

export const enrollInCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.body;

  try {
    // 1. get course info
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Check if user is already enrolled
    const isAlreadyEnrolled =
      course.enrollments &&
      course.enrollments.some(
        (enrollment: any) => enrollment.userId === userId
      );

    if (isAlreadyEnrolled) {
      res
        .status(400)
        .json({ message: "User is already enrolled in this course" });
      return;
    }

    // 2. create initial course progress
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
    });
    await initialProgress.save();

    // 3. add enrollment to relevant course
    await Course.update(
      { courseId },
      {
        $ADD: {
          enrollments: [{ userId }],
        },
      }
    );

    res.json({
      message: "Enrolled in course successfully",
      data: {
        courseProgress: initialProgress,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error enrolling in course", error });
  }
};
