import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import Course from "../models/courseModel";
import { v4 as uuidv4 } from "uuid";

export const createDiscussionPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { content, images } = req.body;
  const auth = getAuth(req);
  const userId = auth?.userId || "";
  const userName = (auth as any)?.userName || "";

  try {
    console.log("Attempting to create discussion post");
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.discussionForum) {
      chapter.discussionForum = [];
    }

    const newPost = {
      postId: uuidv4(),
      userId,
      userName,
      content,
      images: images || [],
      timestamp: new Date().toISOString(),
      replies: [],
    };

    chapter.discussionForum.push(newPost);
    await course.save();

    res.json({
      message: "Discussion post created successfully",
      data: newPost,
    });
  } catch (error) {
    console.error("Error creating discussion post:", error);
    res.status(500).json({
      message: "Error creating discussion post",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getDiscussionPosts = async (
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

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    const discussionForum = chapter.discussionForum || [];

    res.json({
      message: "Discussion posts retrieved successfully",
      data: discussionForum,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving discussion posts", error });
  }
};

export const replyToDiscussionPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, postId } = req.params;
  const { content, images } = req.body;
  const auth = getAuth(req);
  const userId = auth?.userId || "";
  const userName = (auth as any)?.userName || "";

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    if (!chapter.discussionForum) {
      res.status(404).json({ message: "Discussion forum not found" });
      return;
    }

    const post = chapter.discussionForum.find((p: any) => p.postId === postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const newReply = {
      replyId: uuidv4(),
      userId,
      userName,
      content,
      images: images || [],
      timestamp: new Date().toISOString(),
    };

    post.replies.push(newReply);
    await course.save();

    res.json({
      message: "Reply added successfully",
      data: newReply,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding reply", error });
  }
};
