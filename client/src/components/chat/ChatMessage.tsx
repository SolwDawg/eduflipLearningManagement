import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface MessageProps {
  id: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
  senderName: string;
  isRead: boolean;
  attachment?: {
    url: string;
    type: string;
    name: string;
  } | null;
}

const ChatMessage: React.FC<MessageProps> = ({
  content,
  timestamp,
  isCurrentUser,
  senderName,
  isRead,
  attachment,
}) => {
  // Get first letter of the sender's name for avatar fallback
  const avatarFallback = senderName ? senderName.charAt(0).toUpperCase() : "?";

  // Format timestamp
  const formattedTime = timestamp ? format(new Date(timestamp), "h:mm a") : "";

  // Get formatted date for the message
  const formattedDate = timestamp
    ? format(new Date(timestamp), "MMM d, yyyy")
    : "";

  return (
    <div
      className={cn(
        "flex w-full gap-2 mb-4",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt={senderName} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isCurrentUser ? "items-end" : "items-start"
        )}
      >
        {!isCurrentUser && (
          <span className="text-xs text-muted-foreground mb-1">
            {senderName}
          </span>
        )}

        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>

          {attachment && (
            <div className="mt-2">
              {attachment.type.startsWith("image/") ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="max-w-full rounded"
                />
              ) : (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline text-blue-500 hover:text-blue-700"
                >
                  {attachment.name}
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
          {isCurrentUser && (
            <span className="text-xs text-muted-foreground">
              {isRead ? "Read" : "Sent"}
            </span>
          )}
        </div>
      </div>

      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt="You" />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
