"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageSquare } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import ConversationsList from "@/components/ConversationsList";
import ChatUI from "@/components/ChatUI";
import { api } from "@/state/api";

export default function TeacherMessagesPage() {
  const { user } = useUser();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  // Get courses taught by this teacher
  const { data: coursesData } = api.useGetCoursesQuery();

  // Filter to only include courses taught by this teacher
  const teacherCourses = (coursesData || []).filter(
    (course) => course.teacherId === user?.id
  );

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="container py-6">
      <PageTitle
        title="Student Messages"
        description="Chat with your students and provide help with your courses"
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
            {selectedConversation ? "Chat" : "Your Courses"}
          </h2>

          {selectedConversation ? (
            <ChatUI
              courseId={selectedConversation.courseId}
              courseName={selectedConversation.courseName}
              otherUserId={selectedConversation.otherUserId}
              otherUserName={selectedConversation.otherUserName || "Student"}
              otherUserRole="student"
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Your Courses</h3>

              {teacherCourses.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    You don&apos;t have any courses yet.
                    <br />
                    Create a course to start receiving messages from students.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {teacherCourses.map((course) => (
                    <div
                      key={course.courseId}
                      className="border rounded-md p-4"
                    >
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {course.description}
                      </p>
                      <p className="text-sm mt-2">
                        {course.enrollments?.length || 0} students enrolled
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 text-sm text-muted-foreground">
                <p>
                  Students from your courses can send you messages. Once they
                  do, conversations will appear in the list on the left.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
