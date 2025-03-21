import { Request, Response } from "express";
import Chat from "../models/chatModel";
import { v4 as uuidv4 } from "uuid";
import { clerkClient } from "../index";

// Get all chats for a user (student or teacher)
export const getUserChats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await clerkClient.users.getUser(userId);
    const userType = user.publicMetadata.userType;

    let chats;
    if (userType === "student") {
      chats = await Chat.scan("studentId").eq(userId).exec();
    } else if (userType === "teacher") {
      chats = await Chat.scan("teacherId").eq(userId).exec();
    } else {
      res.status(400).json({ message: "Invalid user type" });
      return;
    }

    res.status(200).json({
      message: "Chats retrieved successfully",
      data: chats,
    });
  } catch (error) {
    console.error("Error getting user chats:", error);
    res.status(500).json({
      message: "Error retrieving chats",
      error: (error as Error).message,
    });
  }
};

// Get a specific chat by ID
export const getChatById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.get(chatId);

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    res.status(200).json({
      message: "Chat retrieved successfully",
      data: chat,
    });
  } catch (error) {
    console.error("Error getting chat:", error);
    res.status(500).json({
      message: "Error retrieving chat",
      error: (error as Error).message,
    });
  }
};

// Create a new chat
export const createChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      studentId,
      studentName,
      teacherId,
      teacherName,
      courseId,
      courseName,
      initialMessage,
    } = req.body;

    if (!studentId || !teacherId) {
      res
        .status(400)
        .json({ message: "Student ID and Teacher ID are required" });
      return;
    }

    // Check if chat already exists between these users for this course
    const existingChat = await Chat.scan()
      .where("studentId")
      .eq(studentId)
      .where("teacherId")
      .eq(teacherId)
      .where("courseId")
      .eq(courseId || "")
      .exec();

    if (existingChat && existingChat.length > 0) {
      res.status(200).json({
        message: "Chat already exists",
        data: existingChat[0],
      });
      return;
    }

    // Create message if provided
    const messages = [];
    let lastMessage = null;

    if (initialMessage) {
      const message = {
        messageId: uuidv4(),
        senderId: studentId, // Assuming student initiates the chat
        senderName: studentName,
        content: initialMessage,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      messages.push(message);
      lastMessage = message;
    }

    // Create new chat
    const newChat = new Chat({
      chatId: uuidv4(),
      studentId,
      studentName,
      teacherId,
      teacherName,
      courseId,
      courseName,
      messages,
      lastMessage,
    });

    await newChat.save();

    res.status(201).json({
      message: "Chat created successfully",
      data: newChat,
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({
      message: "Error creating chat",
      error: (error as Error).message,
    });
  }
};

// Add a message to a chat
export const addMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { senderId, senderName, content, attachment } = req.body;

    if (!senderId || !content) {
      res.status(400).json({ message: "Sender ID and content are required" });
      return;
    }

    const chat = await Chat.get(chatId);

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const message = {
      messageId: uuidv4(),
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      attachment: attachment || null,
    };

    // Add message to chat
    chat.messages.push(message);
    chat.lastMessage = message;

    await chat.save();

    res.status(200).json({
      message: "Message added successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({
      message: "Error adding message",
      error: (error as Error).message,
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const chat = await Chat.get(chatId);

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    // Mark messages as read if they were sent by the other user
    let updated = false;
    chat.messages = chat.messages.map((message: any) => {
      if (message.senderId !== userId && !message.isRead) {
        updated = true;
        return { ...message, isRead: true };
      }
      return message;
    });

    if (updated) {
      await chat.save();
    }

    res.status(200).json({
      message: "Messages marked as read",
      data: chat,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      message: "Error marking messages as read",
      error: (error as Error).message,
    });
  }
};

// Delete a chat
export const deleteChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.get(chatId);

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    await Chat.delete(chatId);

    res.status(200).json({
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({
      message: "Error deleting chat",
      error: (error as Error).message,
    });
  }
};
