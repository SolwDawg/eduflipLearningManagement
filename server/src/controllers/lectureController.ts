import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Course from "../models/courseModel";
import { getAuth } from "@clerk/express";
import { generateUploadUrl } from "../utils/mediaStorage";

// Create a new lecture
export const createLecture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId } = req.params;
  const { title, type, content } = req.body;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const sectionIndex = course.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const newLecture = {
      chapterId: uuidv4(),
      type,
      title,
      content,
      comments: [],
    };

    course.sections[sectionIndex].chapters.push(newLecture);
    await course.save();

    res.status(201).json({
      message: "Lecture created successfully",
      data: newLecture,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating lecture", error });
  }
};

// Update a lecture
export const updateLecture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { title, type, content } = req.body;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const sectionIndex = course.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapterIndex = course.sections[sectionIndex].chapters.findIndex(
      (chapter: any) => chapter.chapterId === chapterId
    );

    if (chapterIndex === -1) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Update the lecture
    if (title)
      course.sections[sectionIndex].chapters[chapterIndex].title = title;
    if (type) course.sections[sectionIndex].chapters[chapterIndex].type = type;
    if (content)
      course.sections[sectionIndex].chapters[chapterIndex].content = content;

    await course.save();

    res.json({
      message: "Lecture updated successfully",
      data: course.sections[sectionIndex].chapters[chapterIndex],
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating lecture", error });
  }
};

// Delete a lecture
export const deleteLecture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const sectionIndex = course.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapterIndex = course.sections[sectionIndex].chapters.findIndex(
      (chapter: any) => chapter.chapterId === chapterId
    );

    if (chapterIndex === -1) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Remove the lecture
    course.sections[sectionIndex].chapters.splice(chapterIndex, 1);
    await course.save();

    res.json({
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting lecture", error });
  }
};

// Get PPT upload URL
export const getPPTUploadUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { filename } = req.body;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const fileKey = `lectures/${courseId}/${sectionId}/${chapterId}/ppt/${uuidv4()}-${filename}`;
    const { uploadUrl, fileUrl } = await generateUploadUrl(fileKey);

    res.json({
      uploadUrl,
      fileUrl,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating upload URL", error });
  }
};

// Get video upload URL
export const getVideoUploadUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { filename } = req.body;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const fileKey = `lectures/${courseId}/${sectionId}/${chapterId}/video/${uuidv4()}-${filename}`;
    const { uploadUrl, fileUrl } = await generateUploadUrl(fileKey);

    res.json({
      uploadUrl,
      videoUrl: fileUrl,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating upload URL", error });
  }
};

// Publish a lecture (change status from Draft to Published)
export const publishLecture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const sectionIndex = course.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapterIndex = course.sections[sectionIndex].chapters.findIndex(
      (chapter: any) => chapter.chapterId === chapterId
    );

    if (chapterIndex === -1) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Set status to published
    course.sections[sectionIndex].chapters[chapterIndex].status = "Published";
    await course.save();

    res.json({
      message: "Lecture published successfully",
      data: course.sections[sectionIndex].chapters[chapterIndex],
    });
  } catch (error) {
    res.status(500).json({ message: "Error publishing lecture", error });
  }
};
