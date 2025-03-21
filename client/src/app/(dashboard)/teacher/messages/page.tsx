"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import ChatList, { ChatItemProps } from "@/components/chat/ChatList";
import PageTitle from "@/components/PageTitle";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherMessagesPage() {
  const { user } = useUser();
  const [chats, setChats] = useState<ChatItemProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/chats");

        if (!response.ok) {
          throw new Error("Failed to fetch chats");
        }

        const data = await response.json();

        // Transform the chats data to match the ChatItem props
        const formattedChats = data.data.map((chat: any) => ({
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
          userType: "teacher",
          courseName: chat.courseName,
        }));

        setChats(formattedChats);
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Failed to load chats. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  return (
    <div className="container max-w-6xl py-6">
      <PageTitle title="Student Messages" />

      <div className="bg-card rounded-lg border shadow-sm h-[calc(100vh-180px)] mt-6">
        {isLoading ? (
          <div className="p-4 space-y-4 h-full">
            <Skeleton className="h-8 w-40" />
            <div className="space-y-2 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full p-4">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <ChatList chats={chats} userType="teacher" />
        )}
      </div>
    </div>
  );
}
