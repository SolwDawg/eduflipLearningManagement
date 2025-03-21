import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export interface ChatItemProps {
  id: string;
  name: string;
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  } | null;
  unreadCount?: number;
  isActive?: boolean;
  userType: "student" | "teacher";
  courseName?: string;
}

interface ChatListProps {
  chats: ChatItemProps[];
  onNewChat?: () => void;
  userType: "student" | "teacher";
}

const formatChatTime = (timestamp: string) => {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMM d");
  }
};

const ChatItem: React.FC<ChatItemProps> = ({
  id,
  name,
  lastMessage,
  unreadCount = 0,
  isActive = false,
  userType,
  courseName,
}) => {
  const avatarFallback = name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/${userType === "student" ? "user" : "teacher"}/messages/${id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isActive ? "bg-secondary" : "hover:bg-secondary/50"
      )}
    >
      <Avatar>
        <AvatarImage src="" alt={name} />
        <AvatarFallback>{avatarFallback}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium truncate">{name}</h3>
          {lastMessage && (
            <span className="text-xs text-muted-foreground">
              {formatChatTime(lastMessage.timestamp)}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground truncate">
            {courseName && (
              <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm mr-1">
                {courseName}
              </span>
            )}
            {lastMessage?.content || "No messages yet"}
          </p>

          {unreadCount > 0 && (
            <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full text-xs font-medium w-5 h-5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const ChatList: React.FC<ChatListProps> = ({ chats, onNewChat, userType }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold">Messages</h2>

        {userType === "student" && onNewChat && (
          <Button
            onClick={onNewChat}
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Chat</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chats.length > 0 ? (
          <div className="space-y-1">
            {chats.map((chat) => (
              <ChatItem key={chat.id} {...chat} userType={userType} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground mb-2">No messages yet</p>
            {userType === "student" && onNewChat && (
              <Button
                onClick={onNewChat}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Start a new conversation</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
