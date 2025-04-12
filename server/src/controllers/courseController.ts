import { IncomingForm } from "formidable";
import { Request, Response } from "express";
import Course from "../models/courseModel";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/express";
import UserCourseProgress from "../models/userCourseProgressModel";
import { clerkClient } from "../index";

const s3 = new AWS.S3();

/**
 * Utility function to ensure all Quiz type chapters have a valid quiz object with questions array
 * to prevent "Cannot read properties of undefined (reading 'questions')" errors
 */
const processQuizChapters = (course: any): any => {
  try {
    if (!course || typeof course !== "object") return course;
    if (!course.sections || !Array.isArray(course.sections)) return course;

    const processedSections = course.sections.map((section: any) => {
      if (!section || !section.chapters || !Array.isArray(section.chapters))
        return section;

      const processedChapters = section.chapters.map((chapter: any) => {
        if (!chapter) return chapter;

        // If chapter is a Quiz type but has no quiz property or quiz.questions is undefined
        if (chapter.type === "Quiz") {
          // Ensure quiz object exists
          const quiz = chapter.quiz || {};

          // Ensure questions array exists
          return {
            ...chapter,
            quiz: {
              ...quiz,
              questions: Array.isArray(quiz.questions) ? quiz.questions : [],
            },
          };
        }
        return chapter;
      });

      return { ...section, chapters: processedChapters };
    });

    return { ...course, sections: processedSections };
  } catch (err) {
    console.error("Error in processQuizChapters:", err);
    // Return the original course to prevent further errors
    return course;
  }
};

export const listCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Remove category filtering from listCourses
  try {
    let courses = [];

    try {
      console.log("Getting all courses");
      // Process courses individually to avoid single error breaking entire response
      const rawCourses = await Course.scan().exec();
      courses = rawCourses.map((course) => {
        try {
          return processQuizChapters(course);
        } catch (e) {
          console.error(`Failed to process course ${course.courseId}:`, e);
          return course; // Return original course if processing fails
        }
      });
    } catch (scanError) {
      console.error("DynamoDB scan error:", scanError);
      // Attempt to recover with a direct scan
      console.log("Attempting recovery with direct scan");
      try {
        const rawCourses = await Course.scan().exec();

        // Process each course individually to prevent single error from breaking entire response
        courses = rawCourses.map((course) => {
          try {
            return processQuizChapters(course);
          } catch (e) {
            console.error(`Failed to process course ${course.courseId}:`, e);
            return course; // Return original course if processing fails
          }
        });
      } catch (recoveryError) {
        console.error("Recovery scan failed:", recoveryError);
        throw recoveryError;
      }
    }

    res.json({ message: "Courses retrieved successfully", data: courses });
  } catch (error) {
    console.error("Error retrieving courses:", error);
    res.status(500).json({
      message: "Error retrieving courses",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  try {
    let course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    try {
      // Preprocess course to ensure Quiz chapters have valid quiz objects
      course = processQuizChapters(course);
    } catch (processingError) {
      console.error(`Error processing course ${courseId}:`, processingError);
      // Continue with original course if processing fails
    }

    res.json({ message: "Course retrieved successfully", data: course });
  } catch (error) {
    console.error(`Error retrieving course ${courseId}:`, error);
    res.status(500).json({
      message: "Error retrieving course",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const createCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { teacherId, teacherName } = req.body;

    if (!teacherId || !teacherName) {
      res.status(400).json({ message: "Teacher Id and name are required" });
      return;
    }

    const newCourse = new Course({
      courseId: uuidv4(),
      teacherId,
      teacherName,
      title: "Untitled Course",
      description: "",
      image: "",
      level: "Beginner",
      status: "Draft",
      sections: [],
      enrollments: [],
    });
    await newCourse.save();

    res.json({ message: "Course created successfully", data: newCourse });
  } catch (error) {
    res.status(500).json({ message: "Error creating course", error });
  }
};

export const updateCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  console.log(`[updateCourse] Updating course ${courseId}`);
  console.log(
    `[updateCourse] Request content type: ${req.headers["content-type"]}`
  );

  // First try a simpler approach - the client sends title, description, status, sections
  if (req.is("multipart/form-data")) {
    try {
      // Use a simple approach without streaming to avoid hanging
      const updateData: Record<string, any> = {};
      console.log("[updateCourse] Using simplified form parsing approach");

      // Create a native Node.js promise-based form parser to avoid hanging
      const busboy = require("busboy");
      const bb = busboy({ headers: req.headers });

      // Set a timeout in case parsing hangs
      const timeout = setTimeout(() => {
        console.error("[updateCourse] Form parsing timeout after 10 seconds");
        bb.emit("error", new Error("Form parsing timeout"));
      }, 10000);

      // Process form fields
      bb.on("field", (name: string, val: string) => {
        console.log(`[updateCourse] Received field ${name}`);
        try {
          if (name === "sections") {
            updateData[name] = JSON.parse(val);
          } else {
            updateData[name] = val;
          }
        } catch (error) {
          console.error(
            `[updateCourse] Error processing field ${name}:`,
            error
          );
        }
      });

      // Process form completion
      bb.on("close", async () => {
        clearTimeout(timeout);
        console.log("[updateCourse] Form parsing completed");

        try {
          // Update the course in the database
          const course = await Course.get(courseId);
          if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
          }

          console.log(`[updateCourse] Received update data:`, updateData);

          // Update each field
          for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
              course[key] = value;
            }
          }

          await course.save();
          console.log("[updateCourse] Course updated successfully");
          res.json({ message: "Course updated successfully", data: course });
        } catch (error) {
          console.error("[updateCourse] Error saving course:", error);
          res.status(500).json({
            message: "Error saving course",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // Handle parsing errors
      bb.on("error", (error: Error) => {
        clearTimeout(timeout);
        console.error("[updateCourse] Form parsing error:", error);
        res.status(400).json({
          message: "Error parsing form data",
          error: error.message,
        });
      });

      // Pipe the request to busboy
      req.pipe(bb);
      return; // Important: return here to avoid continuing execution
    } catch (formError) {
      console.error("[updateCourse] Form handling error:", formError);
      res.status(500).json({
        message: "Error handling form data",
        error:
          formError instanceof Error ? formError.message : String(formError),
      });
      return;
    }
  } else {
    // Regular JSON request - this part can remain unchanged
    try {
      console.log(`[updateCourse] Processing regular JSON request`);
      const updateData = req.body;

      const course = await Course.get(courseId);
      if (!course) {
        res.status(404).json({ message: "Course not found" });
        return;
      }

      // Update each field
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          course[key] = value;
        }
      }

      await course.save();
      console.log("[updateCourse] Course updated successfully via JSON");
      res.json({ message: "Course updated successfully", data: course });
    } catch (error) {
      console.error("[updateCourse] Error updating course:", error);
      res.status(500).json({
        message: "Error updating course",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to delete this course " });
      return;
    }

    await Course.delete(courseId);

    res.json({ message: "Course deleted successfully", data: course });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
};

export const getUploadVideoUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    res.status(400).json({ message: "File name and type are required" });
    return;
  }

  try {
    const uniqueId = uuidv4();
    const s3Key = `videos/${uniqueId}/${fileName}`;

    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: s3Key,
      Expires: 60,
      ContentType: fileType,
    };

    const uploadUrl = s3.getSignedUrl("putObject", s3Params);
    const videoUrl = `${process.env.CLOUDFRONT_DOMAIN}/videos/${uniqueId}/${fileName}`;

    res.json({
      message: "Upload URL generated successfully",
      data: { uploadUrl, videoUrl },
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating upload URL", error });
  }
};

export const getUploadImageUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fileName, fileType } = req.body;
  const { courseId } = req.params;

  if (!fileName || !fileType) {
    res.status(400).json({ message: "File name and type are required" });
    return;
  }

  try {
    const uniqueId = uuidv4();
    const s3Key = `images/courses/${courseId}/${uniqueId}-${fileName}`;

    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: s3Key,
      Expires: 60,
      ContentType: fileType,
    };

    const uploadUrl = s3.getSignedUrl("putObject", s3Params);
    const imageUrl = `${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`;

    res.json({
      message: "Image upload URL generated successfully",
      data: { uploadUrl, imageUrl },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generating image upload URL", error });
  }
};

export const updateMeetLink = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { meetLink, generateNew, userId } = req.body;
  const authUserId = getAuth(req)?.userId || userId; // Use user ID from request body as fallback

  try {
    console.log(
      `Processing meet link update for course ${courseId} by user ${authUserId}`
    );

    const course = await Course.get(courseId);
    if (!course) {
      console.log(`Course not found: ${courseId}`);
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify the teacher owns this course
    if (course.teacherId !== authUserId) {
      console.log(
        `Authorization failed: Teacher ID mismatch. Expected ${course.teacherId}, got ${authUserId}`
      );
      res.status(403).json({ message: "Not authorized to update this course" });
      return;
    }

    // Process the meeting link - it could be a full URL or just a meeting code
    if (meetLink) {
      // Store the link as provided - the frontend will handle formatting
      course.meetLink = meetLink;
      console.log(`Updated meet link: ${meetLink}`);
    }

    await course.save();
    console.log(`Meet link updated successfully for course ${courseId}`);

    res.json({
      message: "Google Meet link updated successfully",
      data: { courseId, meetLink: course.meetLink },
    });
  } catch (error) {
    console.error("Error updating Google Meet link:", error);
    res.status(500).json({
      message: "Error updating Google Meet link",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Search courses by keywords
 * This endpoint allows searching through course titles, descriptions, and section/chapter content
 */
export const searchCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
      res.status(200).json({ courses: [] });
      return;
    }

    const searchTerm = query.toLowerCase();

    // Get all published courses
    const courses = await Course.scan("status").eq("Published").exec();

    if (!courses || courses.length === 0) {
      res.status(200).json({ courses: [] });
      return;
    }

    // Score and filter courses based on search relevance
    const scoredCourses = courses.map((course) => {
      const courseObj = course.toJSON();
      let score = 0;

      // Check title (highest weight)
      if (courseObj.title.toLowerCase().includes(searchTerm)) {
        score += 10;
      }

      // Check description (medium weight)
      if (
        courseObj.description &&
        courseObj.description.toLowerCase().includes(searchTerm)
      ) {
        score += 5;
      }

      // Check teacher name
      if (courseObj.teacherName.toLowerCase().includes(searchTerm)) {
        score += 3;
      }

      // Check category
      if (
        courseObj.category &&
        courseObj.category.toLowerCase().includes(searchTerm)
      ) {
        score += 3;
      }

      // Check through sections and chapters (lower weight)
      if (courseObj.sections && Array.isArray(courseObj.sections)) {
        courseObj.sections.forEach((section) => {
          // Check section titles
          if (section.sectionTitle.toLowerCase().includes(searchTerm)) {
            score += 2;
          }

          // Check chapters
          if (section.chapters && Array.isArray(section.chapters)) {
            section.chapters.forEach(
              (chapter: { title: string; type?: string; content?: string }) => {
                // Check chapter titles
                if (chapter.title.toLowerCase().includes(searchTerm)) {
                  score += 1;
                }

                // Check chapter content for text chapters
                if (chapter.type === "Text" && chapter.content) {
                  if (chapter.content.toLowerCase().includes(searchTerm)) {
                    score += 1;
                  }
                }
              }
            );
          }
        });
      }

      return { course: courseObj, score };
    });

    // Filter out courses with no relevance and sort by score
    const relevantCourses = scoredCourses
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.course);

    res.status(200).json({ courses: relevantCourses });
  } catch (error) {
    console.error("Error searching courses:", error);
    // Return empty array instead of error
    res.status(200).json({ courses: [] });
  }
};

export const getStudentsProgress = async (
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

    // Get the course to verify the teacher is the owner
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify that the requester is the teacher of this course
    if (course.teacherId !== auth.userId) {
      res.status(403).json({
        message: "Access denied. You are not the teacher of this course.",
      });
      return;
    }

    // Get all enrolled students
    const enrolledStudents = course.enrollments || [];

    if (enrolledStudents.length === 0) {
      res.json({
        message: "No students enrolled in this course",
        data: {
          students: [],
          courseTitle: course.title,
        },
      });
      return;
    }

    // Get progress data for all enrolled students
    const studentIds = enrolledStudents.map(
      (enrollment: any) => enrollment.userId
    );

    // Fetch progress data for each student
    const progressPromises = studentIds.map(async (userId: string) => {
      try {
        // Get progress records for this student and course
        const progressRecords = await UserCourseProgress.scan({
          userId: userId,
          courseId: courseId,
        }).exec();

        // Calculate overall completion percentage
        let totalChapters = 0;
        let completedChapters = 0;

        course.sections.forEach((section: any) => {
          if (section.chapters && Array.isArray(section.chapters)) {
            totalChapters += section.chapters.length;
          }
        });

        // Get the number of completed chapters from progress records
        if (progressRecords.length > 0) {
          const userProgress = progressRecords[0];
          const completedChapterIds = userProgress.completedChapters || [];
          completedChapters = completedChapterIds.length;
        }

        const completionPercentage =
          totalChapters > 0
            ? Math.round((completedChapters / totalChapters) * 100)
            : 0;

        // Fetch user data from Clerk (if available)
        let userData = {
          id: userId,
          name: "Unknown Student",
          email: "unknown",
        };
        try {
          const clerkUser = await clerkClient.users.getUser(userId);
          userData = {
            id: userId,
            name:
              `${clerkUser.firstName || ""} ${
                clerkUser.lastName || ""
              }`.trim() || "Unknown Student",
            email: clerkUser.emailAddresses[0]?.emailAddress || "unknown",
          };
        } catch (error) {
          console.error(`Failed to fetch user data for ${userId}:`, error);
        }

        // Combine all data for this student
        return {
          student: userData,
          progress: {
            completedChapters,
            totalChapters,
            completionPercentage,
            lastActivity:
              progressRecords.length > 0 ? progressRecords[0].updatedAt : null,
          },
        };
      } catch (error) {
        console.error(
          `Error processing progress for student ${userId}:`,
          error
        );
        return {
          student: { id: userId, name: "Unknown Student", email: "unknown" },
          progress: {
            completedChapters: 0,
            totalChapters: 0,
            completionPercentage: 0,
            lastActivity: null,
            error: "Failed to retrieve progress data",
          },
        };
      }
    });

    // Wait for all promises to resolve
    const studentsWithProgress = await Promise.all(progressPromises);

    // Sort by completion percentage (descending)
    studentsWithProgress.sort(
      (a, b) =>
        b.progress.completionPercentage - a.progress.completionPercentage
    );

    res.json({
      message: "Students progress retrieved successfully",
      data: {
        students: studentsWithProgress,
        courseTitle: course.title,
        courseId: courseId,
      },
    });
  } catch (error) {
    console.error("Error retrieving students progress:", error);
    res.status(500).json({
      message: "Error retrieving students progress",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getStudentDetailedProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId, studentId } = req.params;
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get the course to verify the teacher is the owner
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify that the requester is the teacher of this course
    if (course.teacherId !== auth.userId) {
      res.status(403).json({
        message: "Access denied. You are not the teacher of this course.",
      });
      return;
    }

    // Check if the student is enrolled in this course
    const isEnrolled =
      course.enrollments &&
      Array.isArray(course.enrollments) &&
      course.enrollments.some(
        (enrollment: any) => enrollment.userId === studentId
      );

    if (!isEnrolled) {
      res.status(404).json({ message: "Student not enrolled in this course" });
      return;
    }

    // Get student's progress data
    const progressRecords = await UserCourseProgress.scan({
      userId: studentId,
      courseId: courseId,
    }).exec();

    // Get user data from Clerk
    let userData = { id: studentId, name: "Unknown Student", email: "unknown" };
    try {
      const clerkUser = await clerkClient.users.getUser(studentId);
      userData = {
        id: studentId,
        name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "Unknown Student",
        email: clerkUser.emailAddresses[0]?.emailAddress || "unknown",
      };
    } catch (error) {
      console.error(`Failed to fetch user data for ${studentId}:`, error);
    }

    // Structure the course content with progress data
    const sectionsWithProgress = course.sections.map((section: any) => {
      const chaptersWithProgress = section.chapters.map((chapter: any) => {
        // Check if this chapter is completed
        const isCompleted =
          progressRecords.length > 0 &&
          progressRecords[0].completedChapters &&
          progressRecords[0].completedChapters.includes(chapter.chapterId);

        // Get quiz results if this is a quiz chapter
        let quizResults = null;
        if (
          chapter.type === "Quiz" &&
          progressRecords.length > 0 &&
          progressRecords[0].quizResults
        ) {
          quizResults = progressRecords[0].quizResults.find(
            (result: any) => result.chapterId === chapter.chapterId
          );
        }

        return {
          ...chapter,
          progress: {
            completed: isCompleted,
            quizResults: quizResults
              ? {
                  score: quizResults.score,
                  attempts: quizResults.attempts,
                  lastAttempt: quizResults.lastAttempt,
                  passed: quizResults.passed,
                }
              : null,
          },
        };
      });

      // Calculate section completion percentage
      const totalChapters = chaptersWithProgress.length;
      const completedChapters = chaptersWithProgress.filter(
        (chapter: any) => chapter.progress.completed
      ).length;
      const completionPercentage =
        totalChapters > 0
          ? Math.round((completedChapters / totalChapters) * 100)
          : 0;

      return {
        ...section,
        chapters: chaptersWithProgress,
        progress: {
          completedChapters,
          totalChapters,
          completionPercentage,
        },
      };
    });

    // Calculate overall course completion
    let totalChapters = 0;
    let completedChapters = 0;

    sectionsWithProgress.forEach((section: any) => {
      totalChapters += section.progress.totalChapters;
      completedChapters += section.progress.completedChapters;
    });

    const overallCompletionPercentage =
      totalChapters > 0
        ? Math.round((completedChapters / totalChapters) * 100)
        : 0;

    // Get last active timestamp
    const lastActivity =
      progressRecords.length > 0 ? progressRecords[0].updatedAt : null;

    // Return the detailed progress data
    res.json({
      message: "Student progress retrieved successfully",
      data: {
        student: userData,
        courseTitle: course.title,
        courseId: courseId,
        sections: sectionsWithProgress,
        overallProgress: {
          completedChapters,
          totalChapters,
          completionPercentage: overallCompletionPercentage,
          lastActivity,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving student progress:", error);
    res.status(500).json({
      message: "Error retrieving student progress",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
