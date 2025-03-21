import express from "express";
import {
  getUserChats,
  getChatById,
  createChat,
  addMessage,
  markMessagesAsRead,
  deleteChat,
} from "../controllers/chatController";

const router = express.Router();

/**
 * @swagger
 * /api/chats/user/{userId}:
 *   get:
 *     summary: Get all chats for a user
 *     description: Retrieve all chats for a student or teacher
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
 */
router.get("/user/:userId", getUserChats);

/**
 * @swagger
 * /api/chats/{chatId}:
 *   get:
 *     summary: Get a chat by ID
 *     description: Retrieve a specific chat by its ID
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat retrieved successfully
 */
router.get("/:chatId", getChatById);

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Create a new chat
 *     description: Create a new chat between a student and teacher
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - teacherId
 *             properties:
 *               studentId:
 *                 type: string
 *               studentName:
 *                 type: string
 *               teacherId:
 *                 type: string
 *               teacherName:
 *                 type: string
 *               courseId:
 *                 type: string
 *               courseName:
 *                 type: string
 *               initialMessage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Chat created successfully
 */
router.post("/", createChat);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   post:
 *     summary: Add a message to a chat
 *     description: Add a new message to an existing chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *               - content
 *             properties:
 *               senderId:
 *                 type: string
 *               senderName:
 *                 type: string
 *               content:
 *                 type: string
 *               attachment:
 *                 type: object
 *     responses:
 *       200:
 *         description: Message added successfully
 */
router.post("/:chatId/messages", addMessage);

/**
 * @swagger
 * /api/chats/{chatId}/read:
 *   patch:
 *     summary: Mark messages as read
 *     description: Mark all messages in a chat as read for a user
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.patch("/:chatId/read", markMessagesAsRead);

/**
 * @swagger
 * /api/chats/{chatId}:
 *   delete:
 *     summary: Delete a chat
 *     description: Delete a chat by its ID
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 */
router.delete("/:chatId", deleteChat);

export default router;
