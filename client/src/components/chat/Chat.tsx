import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import ChatMessage, { MessageProps } from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatProps {
  chatId: string;
  recipientId: string;
  recipientName: string;
  courseName?: string;
  onBack?: () => void;
  className?: string;
}

interface Message {
  messageId: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isRead: boolean;
  attachment?: {
    url: string;
    type: string;
    name: string;
  } | null;
}

interface ChatData {
  chatId: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  courseId?: string;
  courseName?: string;
  messages: Message[];
  lastMessage?: Message;
}

const Chat: React.FC<ChatProps> = ({
  chatId,
  recipientId,
  recipientName,
  courseName,
  onBack,
  className = "",
}) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/chats/${chatId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      const chatData: ChatData = data.data;

      if (chatData?.messages) {
        setMessages(chatData.messages);
      }

      // Mark messages as read
      if (
        user?.id &&
        chatData.messages.some((m) => m.senderId !== user.id && !m.isRead)
      ) {
        await fetch(`/api/chats/${chatId}/read`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        });
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, attachment?: File) => {
    if (!user || !content.trim()) return;

    try {
      setIsSending(true);

      // If we have an attachment, upload it first
      let attachmentData = null;
      if (attachment) {
        // In a real app, you would upload the file to a storage service
        // This is a simplified example
        attachmentData = {
          url: URL.createObjectURL(attachment),
          type: attachment.type,
          name: attachment.name,
        };
      }

      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          content,
          attachment: attachmentData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add new message to the list
      const newMessage: Message = data.data;
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Convert backend messages to component format
  const formattedMessages: MessageProps[] = messages.map((message) => ({
    id: message.messageId,
    content: message.content,
    timestamp: message.timestamp,
    isCurrentUser: message.senderId === user?.id,
    senderName: message.senderName,
    isRead: message.isRead,
    attachment: message.attachment,
  }));

  // Get recipient avatar fallback
  const avatarFallback = recipientName
    ? recipientName.charAt(0).toUpperCase()
    : "?";

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        {onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10">
          <AvatarImage src="" alt={recipientName} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="font-semibold">{recipientName}</h2>
          {courseName && (
            <p className="text-xs text-muted-foreground">{courseName}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          // Loading state
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                i % 2 ? "justify-start" : "justify-end"
              }`}
            >
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <div
                className={`space-y-2 ${i % 2 ? "items-start" : "items-end"}`}
              >
                <Skeleton
                  className={`h-10 w-40 rounded-lg ${i % 2 ? "" : "ml-auto"}`}
                />
                <Skeleton className={`h-3 w-20 ${i % 2 ? "" : "ml-auto"}`} />
              </div>
              {i % 2 === 1 && <Skeleton className="h-8 w-8 rounded-full" />}
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="flex justify-center items-center h-full">
            <p className="text-destructive">{error}</p>
          </div>
        ) : formattedMessages.length > 0 ? (
          // Messages
          formattedMessages.map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))
        ) : (
          // Empty state
          <div className="flex justify-center items-center h-full">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isSending} />
      </div>
    </div>
  );
};

export default Chat;
