"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useGetChapterCommentsQuery,
  useAddChapterCommentMutation,
  useDeleteChapterCommentMutation,
} from "@/state/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface ChapterCommentsProps {
  courseId: string;
  sectionId: string;
  chapterId: string;
}

export default function ChapterComments({
  courseId,
  sectionId,
  chapterId,
}: ChapterCommentsProps) {
  const { user, isLoaded } = useUser();
  const [commentText, setCommentText] = useState("");

  const {
    data: comments,
    isLoading: isLoadingComments,
    refetch,
  } = useGetChapterCommentsQuery(
    { courseId, sectionId, chapterId },
    { skip: !courseId || !sectionId || !chapterId }
  );

  const [addComment, { isLoading: isAddingComment }] =
    useAddChapterCommentMutation();

  const [deleteComment, { isLoading: isDeletingComment }] =
    useDeleteChapterCommentMutation();

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    try {
      await addComment({
        courseId,
        sectionId,
        chapterId,
        text: commentText.trim(),
      }).unwrap();

      setCommentText("");
      await refetch();
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment({
        courseId,
        sectionId,
        chapterId,
        commentId,
      }).unwrap();

      toast.success("Comment deleted successfully");
      await refetch();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6 pt-6 border-t">
      <h3 className="text-lg font-semibold">Comments</h3>

      {/* Comment input */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
          <AvatarFallback>
            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="resize-none min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Press Ctrl+Enter to submit
          </p>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isAddingComment}
              size="sm"
              className="flex items-center gap-1"
            >
              {isAddingComment ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4 mt-4">
        {isLoadingComments ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments?.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No comments yet. Be the first to comment!
            </CardContent>
          </Card>
        ) : (
          comments?.map((comment) => (
            <div key={comment.commentId} className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium text-sm">
                      {comment.userId === user?.id ? "You" : "User"}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), {
                          addSuffix: true,
                        })}
                      </div>

                      {comment.userId === user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleDeleteComment(comment.commentId)
                              }
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
