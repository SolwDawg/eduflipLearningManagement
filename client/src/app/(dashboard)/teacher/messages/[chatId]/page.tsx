"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Chat from "@/components/chat/Chat";
import ChatList, { ChatItemProps } from "@/components/chat/ChatList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

export default function TeacherChatPage({ params }: ChatPageProps) {
  const { chatId } = params;
  const router = useRouter();
  const { user } = useUser();
  const [chats, setChats] = useState<ChatItemProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatData, setChatData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch all chats
        const chatsResponse = await fetch("/api/chats");

        if (!chatsResponse.ok) {
          throw new Error("Failed to fetch chats");
        }

        const chatsData = await chatsResponse.json();

        // Transform the chats data to match the ChatItem props
        const formattedChats = chatsData.data.map((chat: any) => ({
          id: chat.chatId,
          name: chat.studentName,
          lastMessage: chat.lastMessage
            ? {
                content: chat.lastMessage.content,
                timestamp: chat.lastMessage.timestamp,
                isRead: chat.lastMessage.isRead,
              }
            : null,
          unreadCount: chat.messages.filter(
            (msg: any) => msg.senderId !== user.id && !msg.isRead
          ).length,
          isActive: chat.chatId === chatId,
          userType: "teacher",
          courseName: chat.courseName,
        }));

        setChats(formattedChats);

        // Fetch current chat data
        const chatResponse = await fetch(`/api/chats/${chatId}`);

        if (!chatResponse.ok) {
          throw new Error("Failed to fetch chat");
        }

        const chatDataResponse = await chatResponse.json();
        setChatData(chatDataResponse.data);
      } catch (err) {
        console.error("Error fetching chat data:", err);
        setError("Failed to load chat. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [user, chatId]);

  const handleBack = () => {
    router.push("/teacher/messages");
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="grid md:grid-cols-[300px_1fr] gap-6 h-[calc(100vh-160px)]">
          <div className="hidden md:block border rounded-lg shadow-sm">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="border rounded-lg shadow-sm">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !chatData) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)]">
          <p className="text-destructive mb-4">{error || "Chat not found"}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  // Determine the recipient based on the user type (for teacher, the recipient is the student)
  const recipientId = chatData.studentId;
  const recipientName = chatData.studentName;

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex md:hidden items-center mb-4">
        <Button
          onClick={handleBack}
          variant="ghost"
          size="sm"
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-6 h-[calc(100vh-180px)]">
        {/* Chat list (hidden on mobile) */}
        <div className="hidden md:block bg-card border rounded-lg shadow-sm overflow-hidden">
          <ChatList chats={chats} userType="teacher" />
        </div>

        {/* Chat area */}
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          <Chat
            chatId={chatId}
            recipientId={recipientId}
            recipientName={recipientName}
            courseName={chatData.courseName}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
}
