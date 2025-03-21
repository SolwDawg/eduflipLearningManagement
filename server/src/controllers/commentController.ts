import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Course from "../models/courseModel";
import { getAuth } from "@clerk/express";

// Get comments for a specific chapter
export const getChapterComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find(
      (section: any) => section.sectionId === sectionId
    );

    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (chapter: any) => chapter.chapterId === chapterId
    );

    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Return comments or empty array if none exist
    res.json(chapter.comments || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments", error });
  }
};

// Add a comment to a chapter
export const addChapterComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { text, imageUrl } = req.body;
  const { userId } = getAuth(req);

  if (!text && !imageUrl) {
    res.status(400).json({ message: "Comment must have text or image" });
    return;
  }

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
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

    // Create new comment
    const newComment = {
      commentId: uuidv4(),
      userId,
      text,
      imageUrl,
      timestamp: new Date().toISOString(),
    };

    // Initialize comments array if it doesn't exist
    if (!course.sections[sectionIndex].chapters[chapterIndex].comments) {
      course.sections[sectionIndex].chapters[chapterIndex].comments = [];
    }

    // Add the comment
    course.sections[sectionIndex].chapters[chapterIndex].comments.push(
      newComment
    );
    await course.save();

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
};

// Delete a comment from a chapter
export const deleteChapterComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, commentId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
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

    // Get the chapter
    const chapter = course.sections[sectionIndex].chapters[chapterIndex];

    // Check if comments array exists
    if (!chapter.comments || !Array.isArray(chapter.comments)) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Find the comment index
    const commentIndex = chapter.comments.findIndex(
      (comment: any) => comment.commentId === commentId
    );

    if (commentIndex === -1) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Check if user is the comment author or has admin rights
    const comment = chapter.comments[commentIndex];
    if (comment.userId !== userId && course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
      return;
    }

    // Remove the comment
    chapter.comments.splice(commentIndex, 1);
    await course.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment", error });
  }
};
