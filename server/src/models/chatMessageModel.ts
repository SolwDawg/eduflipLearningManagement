import * as dynamoose from "dynamoose";

// Define the schema for chat messages
const chatMessageSchema = new dynamoose.Schema(
  {
    messageId: {
      type: String,
      hashKey: true,
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: {
        name: "conversationIndex",
        type: "global",
      },
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
      enum: ["student", "teacher"],
    },
    recipientId: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: {
        name: "timestampIndex",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Optional fields
    attachments: {
      type: Array,
      schema: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
const ChatMessage = dynamoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;
