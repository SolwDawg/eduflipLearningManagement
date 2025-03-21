import express from "express";
import { requireAuth } from "@clerk/express";
import {
  createDiscussionPost,
  replyToDiscussionPost,
  getDiscussionPosts,
} from "../controllers/discussionController";

const router = express.Router();

// Get all discussion posts for a chapter
router.get(
  "/:courseId/sections/:sectionId/chapters/:chapterId/discussion",
  requireAuth(),
  getDiscussionPosts
);

// Create a new discussion post
router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/discussion",
  requireAuth(),
  createDiscussionPost
);

// Reply to a discussion post
router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/discussion/:postId/reply",
  requireAuth(),
  replyToDiscussionPost
);

export default router;
