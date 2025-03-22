"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { Send, Paperclip, UserRound, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetConversationMessagesQuery,
  useSendChatMessageMutation,
  useMarkMessageAsReadMutation,
} from "@/state/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ChatUIProps {
  courseId: string;
  courseName: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: "student" | "teacher";
  onClose?: () => void;
}

export default function ChatUI({
  courseId,
  courseName,
  otherUserId,
  otherUserName,
  otherUserRole,
  onClose,
}: ChatUIProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetConversationMessagesQuery(
    { courseId, userId: otherUserId },
    { pollingInterval: 10000 } // Poll every 10 seconds for new messages
  );

  // Send message
  const [sendMessage, { isLoading: isSendingMessage }] =
    useSendChatMessageMutation();

  // Mark as read
  const [markAsRead] = useMarkMessageAsReadMutation();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData]);

  // Mark unread messages as read
  useEffect(() => {
    if (messagesData?.data) {
      const unreadMessages = messagesData.data.filter(
        (msg: any) => msg.recipientId === user?.id && !msg.isRead
      );

      unreadMessages.forEach((msg: any) => {
        markAsRead(msg.messageId).catch(console.error);
      });
    }
  }, [messagesData, user?.id, markAsRead]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage({
        courseId,
        recipientId: otherUserId,
        content: message.trim(),
      }).unwrap();

      setMessage("");
      refetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const messages = messagesData?.data || [];

  return (
    <Card className="w-full max-w-md h-[600px] flex flex-col">
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={otherUserName} />
            <AvatarFallback>
              {otherUserName?.charAt(0) || <UserRound className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{otherUserName}</CardTitle>
            <div className="text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {otherUserRole === "teacher" ? "Teacher" : "Student"}
              </Badge>
              <span className="ml-2">{courseName}</span>
            </div>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg: any) => {
              const isSender = msg.senderId === user?.id;
              return (
                <div
                  key={msg.messageId}
                  className={`flex ${
                    isSender ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      isSender
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    <div className="text-sm">{msg.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isSender
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(new Date(msg.timestamp), "p")}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <CardContent className="p-3 pt-0 border-t mt-auto">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSendingMessage}
            size="icon"
            className="flex-shrink-0"
          >
            {isSendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
