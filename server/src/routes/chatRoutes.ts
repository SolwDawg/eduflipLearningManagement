import express from "express";
import { requireAuth } from "@clerk/express";
import {
  sendMessage,
  getConversation,
  getUserConversations,
  markMessageAsRead,
} from "../controllers/chatController";

const router = express.Router();

// Get all conversations for the current user
router.get("/conversations", requireAuth(), getUserConversations);

// Get messages for a conversation in a specific course
router.get("/conversations/:courseId/:userId", requireAuth(), getConversation);

// Send a new message
router.post("/messages", requireAuth(), sendMessage);

// Mark a message as read
router.put("/messages/:messageId/read", requireAuth(), markMessageAsRead);

export default router;
