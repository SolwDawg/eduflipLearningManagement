import { IncomingForm } from "formidable";
import { Request, Response } from "express";
import Course from "../models/courseModel";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/express";

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
  const { category } = req.query;
  try {
    let courses = [];

    try {
      if (category && category !== "all") {
        console.log(`Filtering courses by category: ${category}`);
        courses = await Course.scan("category").eq(category).exec();
      } else {
        console.log("Getting all courses without category filter");
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
      }
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
      category: "Uncategorized",
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
  const updateData: Record<string, any> = {};

  // Process form data
  if (req.is("multipart/form-data")) {
    try {
      const form = new IncomingForm();
      const [fields] = await form.parse(req);

      // Extract fields from form data
      for (const [key, value] of Object.entries(fields)) {
        if (value && Array.isArray(value) && value.length > 0) {
          if (key === "sections") {
            try {
              updateData[key] = JSON.parse(value[0] as string);
            } catch (error) {
              console.error("Error parsing sections:", error);
            }
          } else {
            updateData[key] = value[0] as string;
          }
        }
      }
    } catch (err) {
      console.error("Error parsing form data:", err);
      res.status(400).json({ message: "Error parsing form data" });
      return;
    }
  } else {
    // Regular JSON request
    Object.assign(updateData, req.body);
  }

  try {
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
    res.json({ message: "Course updated successfully", data: course });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Error updating course", error });
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

export const getCoursesByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { categorySlug } = req.params;

  try {
    // Find only published courses with matching category
    const courses = await Course.scan({
      status: "Published",
      category: categorySlug,
    }).exec();

    res.json({
      message: "Courses by category retrieved successfully",
      data: courses,
    });
  } catch (error) {
    console.error("Error retrieving courses by category:", error);
    res.status(500).json({
      message: "Error retrieving courses by category",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
