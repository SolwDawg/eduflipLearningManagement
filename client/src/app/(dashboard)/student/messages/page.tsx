"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageSquare } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import ConversationsList from "@/components/ConversationsList";
import ChatUI from "@/components/ChatUI";
import { useGetUserEnrolledCoursesQuery } from "@/state/api";

export default function MessagesPage() {
  const { user } = useUser();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  // Get enrolled courses to find teachers to message
  const { data: enrolledCoursesData } = useGetUserEnrolledCoursesQuery(
    user?.id || ""
  );

  const enrolledCourses = enrolledCoursesData?.data || [];

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="container py-6">
      <PageTitle
        title="Messages"
        description="Chat with teachers and get help with your courses"
        icon={<MessageSquare className="h-6 w-6" />}
      />

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Conversations</h2>
          <ConversationsList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={
              selectedConversation
                ? `${selectedConversation.conversationId}-${selectedConversation.courseId}`
                : undefined
            }
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            {selectedConversation ? "Chat" : "Course Teachers"}
          </h2>

          {selectedConversation ? (
            <ChatUI
              courseId={selectedConversation.courseId}
              courseName={selectedConversation.courseName}
              otherUserId={selectedConversation.otherUserId}
              otherUserName={selectedConversation.otherUserName || "Teacher"}
              otherUserRole="teacher"
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">
                Select a teacher to start a conversation
              </h3>

              {enrolledCourses.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    You are not enrolled in any courses yet.
                    <br />
                    Enroll in a course to chat with teachers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {enrolledCourses.map((course) => (
                    <button
                      key={course.id}
                      className="w-full flex items-start gap-4 p-4 rounded-md hover:bg-accent text-left transition-colors"
                      onClick={() =>
                        setSelectedConversation({
                          courseId: course.id,
                          courseName: course.title,
                          otherUserId: course.teacherId,
                          otherUserName: course.teacherName,
                          conversationId: [user?.id, course.teacherId]
                            .sort()
                            .join("-"),
                        })
                      }
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Teacher: {course.teacherName}
                        </p>
                      </div>
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
