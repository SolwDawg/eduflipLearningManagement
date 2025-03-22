import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { v4 as uuidv4 } from "uuid";
import ChatMessage from "../models/chatMessageModel";
import Course from "../models/courseModel";

/**
 * Send a message from one user to another
 */
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId, recipientId, content, attachments } = req.body;
    const auth = getAuth(req);
    const senderId = auth?.userId || "";
    const senderName = (auth as any)?.userName || "";

    if (!senderId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!courseId || !recipientId || !content) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Get course details
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Determine role (student or teacher)
    let senderRole = "student";
    if (course.teacherId === senderId) {
      senderRole = "teacher";
    }

    // Validate that the user is either the teacher or a student in the course
    const isTeacher = course.teacherId === senderId;
    const isStudent = course.enrolledStudents?.some(
      (student: any) => student.studentId === senderId
    );

    if (!isTeacher && !isStudent) {
      res.status(403).json({ message: "You are not enrolled in this course" });
      return;
    }

    // Generate a conversationId (always format it as smaller ID + larger ID to ensure consistency)
    const conversationId = [senderId, recipientId].sort().join("-");

    // Create message
    const newMessage = {
      messageId: uuidv4(),
      conversationId,
      senderId,
      senderName,
      senderRole,
      recipientId,
      courseId,
      courseName: course.title,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      attachments: attachments || [],
    };

    await ChatMessage.create(newMessage);

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message", error });
  }
};

/**
 * Get conversation messages between two users for a specific course
 */
export const getConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId, userId } = req.params;
    const auth = getAuth(req);
    const currentUserId = auth?.userId || "";

    if (!currentUserId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Generate a conversationId (always format it as smaller ID + larger ID to ensure consistency)
    const conversationId = [currentUserId, userId].sort().join("-");

    // Query messages by conversationId and course
    const messages = await ChatMessage.query("conversationId")
      .eq(conversationId)
      .where("courseId")
      .eq(courseId)
      .sort("descending")
      .exec();

    // Mark messages as read if the current user is the recipient
    const unreadMessages = messages.filter(
      (msg: any) => msg.recipientId === currentUserId && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map(async (msg: any) => {
          msg.isRead = true;
          await msg.save();
        })
      );
    }

    res.json({
      message: "Conversation retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500).json({ message: "Error getting conversation", error });
  }
};

/**
 * Get all conversations for the current user
 */
export const getUserConversations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId || "";

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // We need to find messages where the user is either sender or recipient
    // Since we don't have a direct query for this, we'll use a scan with a filter
    const sentMessages = await ChatMessage.scan()
      .where("senderId")
      .eq(userId)
      .exec();

    const receivedMessages = await ChatMessage.scan()
      .where("recipientId")
      .eq(userId)
      .exec();

    // Combine and get unique conversations
    const allMessages = [...sentMessages, ...receivedMessages];

    // Group messages by conversationId and courseId
    const conversationsMap = new Map();

    allMessages.forEach((msg: any) => {
      const key = `${msg.conversationId}-${msg.courseId}`;
      if (
        !conversationsMap.has(key) ||
        new Date(msg.timestamp) > new Date(conversationsMap.get(key).timestamp)
      ) {
        conversationsMap.set(key, msg);
      }
    });

    // Convert to array and format response
    const conversations = Array.from(conversationsMap.values()).map(
      (msg: any) => {
        const otherUserId =
          msg.senderId === userId ? msg.recipientId : msg.senderId;
        const otherUserName = msg.senderId === userId ? "" : msg.senderName; // We'll need to fetch the other user's name

        return {
          conversationId: msg.conversationId,
          courseId: msg.courseId,
          courseName: msg.courseName,
          otherUserId,
          otherUserName,
          lastMessage: msg.content,
          lastMessageTimestamp: msg.timestamp,
          unreadCount: 0, // Will be calculated below
        };
      }
    );

    // Calculate unread count for each conversation
    for (let conversation of conversations) {
      conversation.unreadCount = receivedMessages.filter(
        (msg: any) =>
          msg.conversationId === conversation.conversationId &&
          msg.courseId === conversation.courseId &&
          !msg.isRead
      ).length;
    }

    // Sort by most recent message
    conversations.sort(
      (a, b) =>
        new Date(b.lastMessageTimestamp).getTime() -
        new Date(a.lastMessageTimestamp).getTime()
    );

    res.json({
      message: "Conversations retrieved successfully",
      data: conversations,
    });
  } catch (error) {
    console.error("Error getting user conversations:", error);
    res
      .status(500)
      .json({ message: "Error getting user conversations", error });
  }
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const auth = getAuth(req);
    const userId = auth?.userId || "";

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const message = await ChatMessage.get(messageId);

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    // Only the recipient can mark a message as read
    if (message.recipientId !== userId) {
      res
        .status(403)
        .json({ message: "Unauthorized to mark this message as read" });
      return;
    }

    message.isRead = true;
    await message.save();

    res.json({
      message: "Message marked as read",
      data: message,
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "Error marking message as read", error });
  }
};
