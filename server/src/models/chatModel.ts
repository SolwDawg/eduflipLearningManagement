import { Schema, model } from "dynamoose";
import { v4 as uuidv4 } from "uuid";

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - messageId
 *         - senderId
 *         - content
 *         - timestamp
 *       properties:
 *         messageId:
 *           type: string
 *           description: The unique identifier for the message
 *         senderId:
 *           type: string
 *           description: The ID of the user who sent the message
 *         senderName:
 *           type: string
 *           description: The name of the sender
 *         content:
 *           type: string
 *           description: The content of the message
 *         timestamp:
 *           type: string
 *           description: When the message was sent
 *         isRead:
 *           type: boolean
 *           description: Whether the message has been read by the recipient
 *         attachment:
 *           type: object
 *           description: Optional attachment (image, file, etc.)
 *
 *     Chat:
 *       type: object
 *       required:
 *         - chatId
 *         - studentId
 *         - teacherId
 *         - courseId
 *       properties:
 *         chatId:
 *           type: string
 *           description: The unique identifier for the chat
 *         studentId:
 *           type: string
 *           description: The ID of the student
 *         studentName:
 *           type: string
 *           description: The name of the student
 *         teacherId:
 *           type: string
 *           description: The ID of the teacher
 *         teacherName:
 *           type: string
 *           description: The name of the teacher
 *         courseId:
 *           type: string
 *           description: The related course ID (optional)
 *         courseName:
 *           type: string
 *           description: The name of the related course
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Message'
 *           description: The messages in this chat
 *         lastMessage:
 *           type: object
 *           $ref: '#/components/schemas/Message'
 *           description: The most recent message in this chat
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the chat was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the chat was last updated
 */

const messageSchema = new Schema({
  messageId: {
    type: String,
    required: true,
    default: uuidv4,
  },
  senderId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
    default: () => new Date().toISOString(),
  },
  isRead: {
    type: Boolean,
    required: true,
    default: false,
  },
  attachment: {
    type: Object,
    schema: {
      url: String,
      type: String,
      name: String,
    },
    required: false,
  },
});

const chatSchema = new Schema(
  {
    chatId: {
      type: String,
      hashKey: true,
      required: true,
      default: uuidv4,
    },
    studentId: {
      type: String,
      required: true,
      index: {
        name: "studentIndex",
        type: "global",
      },
    },
    studentName: {
      type: String,
      required: true,
    },
    teacherId: {
      type: String,
      required: true,
      index: {
        name: "teacherIndex",
        type: "global",
      },
    },
    teacherName: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: false,
    },
    courseName: {
      type: String,
      required: false,
    },
    messages: {
      type: Array,
      schema: [messageSchema],
      default: [],
    },
    lastMessage: {
      type: Object,
      schema: messageSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Chat = model("Chat", chatSchema);
export default Chat;
