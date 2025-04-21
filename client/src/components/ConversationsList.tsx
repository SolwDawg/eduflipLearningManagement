"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageSquare, Search, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetUserConversationsQuery } from "@/state/api";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversationsListProps {
  onSelectConversation: (conversation: any) => void;
  selectedConversationId?: string;
}

export default function ConversationsList({
  onSelectConversation,
  selectedConversationId,
}: ConversationsListProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  // Get all conversations
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useGetUserConversationsQuery(undefined, {
    pollingInterval: 15000, // Poll every 15 seconds for new conversations
  });

  // Poll for new conversations on mount
  useEffect(() => {
    refetchConversations();
  }, [refetchConversations]);

  const conversations = conversationsData?.data || [];

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation: any) => {
    if (!searchQuery.trim()) return true;

    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      conversation.otherUserName.toLowerCase().includes(lowerCaseQuery) ||
      conversation.courseName.toLowerCase().includes(lowerCaseQuery) ||
      conversation.lastMessage.toLowerCase().includes(lowerCaseQuery)
    );
  });

  return (
    <Card className="w-full max-w-md h-[600px] flex flex-col">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">Messages</CardTitle>
          <Badge variant="outline" className="ml-2">
            {conversations.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        {isLoadingConversations ? (
          <div className="p-4 space-y-4">
            {Array(5)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery.trim()
                ? "No conversations matching your search"
                : "No conversations yet"}
            </p>
            {searchQuery.trim() && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="p-1">
            {filteredConversations.map((conversation: any) => (
              <Button
                key={`${conversation.conversationId}-${conversation.courseId}`}
                variant={
                  selectedConversationId ===
                  `${conversation.conversationId}-${conversation.courseId}`
                    ? "secondary"
                    : "ghost"
                }
                className="w-full justify-start px-4 py-3 h-auto"
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start gap-3 text-left">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src="" // Add user image when available
                      alt={conversation.otherUserName}
                    />
                    <AvatarFallback>
                      {conversation.otherUserName?.charAt(0) || (
                        <UserRound className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate max-w-[180px]">
                        {conversation.otherUserName || "User"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            const date = new Date(
                              conversation.updatedAt || conversation.createdAt
                            );
                            if (isNaN(date.getTime())) {
                              return "Thời gian không xác định";
                            }
                            return formatDistanceToNow(date, {
                              addSuffix: true,
                              locale: vi,
                            });
                          } catch (error) {
                            console.error("Error formatting date:", error);
                            return "Thời gian không xác định";
                          }
                        })()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground truncate max-w-[220px]">
                      {conversation.lastMessage}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {conversation.courseName}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="ml-auto">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
