"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetCourseQuery, useGetQuizzesQuery } from "@/state/api";
import Header from "@/components/Header";
import QuizCreator from "@/components/QuizCreator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { Quiz, QuizScope } from "@/types/quiz";
import { formatDate } from "@/lib/utils";

// Error fallback component
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="text-center p-8 border border-red-200 rounded-lg bg-red-50">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Đã xảy ra lỗi</h2>
      <p className="mb-4 text-red-600">{error.message}</p>
      <Button onClick={resetErrorBoundary}>Thử lại</Button>
    </div>
  );
}

export default function CourseQuizzes() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [activeTab, setActiveTab] = useState("existing");
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  // Fetch course and its quizzes
  const { data: course, isLoading: isLoadingCourse } =
    useGetCourseQuery(courseId);
  const { data: quizzes, isLoading: isLoadingQuizzes } = useGetQuizzesQuery({
    courseId,
  });

  // Format sections data for QuizCreator
  const formattedSections =
    course?.sections?.map((section) => ({
      sectionId: section.sectionId,
      title: section.sectionTitle,
      chapters:
        section.chapters?.map((chapter) => ({
          chapterId: chapter.chapterId,
          title: chapter.title,
        })) || [],
    })) || [];

  // Get scope display name
  const getScopeDisplay = (quiz: Quiz) => {
    switch (quiz.scope) {
      case QuizScope.CHAPTER:
        const sectionWithChapter = course?.sections?.find(
          (section) => section.sectionId === quiz.sectionId
        );
        const chapter = sectionWithChapter?.chapters?.find(
          (chapter) => chapter.chapterId === quiz.chapterId
        );
        return `Chapter: ${chapter?.title || "Unknown"}`;

      case QuizScope.SECTION:
        const section = course?.sections?.find(
          (section) => section.sectionId === quiz.sectionId
        );
        return `Section: ${section?.sectionTitle || "Unknown"}`;

      case QuizScope.COURSE:
      default:
        return "Entire Course";
    }
  };

  // Wrap the component rendering in try/catch to prevent unhandled errors
  try {
    return (
      <div className="container py-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href={`/teacher/courses/${courseId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Header
              title={`Bài kiểm tra ${course ? `${course.title}` : ""}`}
              subtitle="Tạo và quản lý bài kiểm tra cho khóa học của bạn"
            />
          </div>
          <p className="text-muted-foreground">
            Tạo và quản lý bài kiểm tra cho khóa học của bạn
          </p>
        </div>

        <Suspense
          fallback={<div className="text-center py-8">Đang tải...</div>}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="w-full flex flex-wrap">
              <TabsTrigger value="existing">Bài kiểm tra hiện có</TabsTrigger>
              <TabsTrigger value="create">Tạo bài kiểm tra</TabsTrigger>
            </TabsList>

            <TabsContent value="existing">
              {isLoadingQuizzes ? (
                <div className="text-center py-8">Đang tải bài kiểm tra...</div>
              ) : quizzes && quizzes.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {quizzes.map((quiz) => (
                    <Card key={quiz.quizId} className="flex flex-col h-full">
                      <CardHeader>
                        <CardTitle className="text-lg sm:text-xl line-clamp-2">
                          {quiz.title}
                        </CardTitle>
                        <CardDescription>
                          {getScopeDisplay(quiz)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Câu hỏi:</span>{" "}
                            {quiz.questions.length}
                          </div>
                          {quiz.timeLimit && (
                            <div>
                              <span className="font-medium">
                                Thời gian giới hạn:
                              </span>{" "}
                              {quiz.timeLimit} phút
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Trạng thái:</span>{" "}
                            <span
                              className={
                                quiz.isPublished
                                  ? "text-green-600"
                                  : "text-amber-600"
                              }
                            >
                              {quiz.isPublished ? "Published" : "Draft"}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Ngày tạo:</span>{" "}
                            {formatDate(quiz.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between mt-auto pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <Link
                            href={`/teacher/courses/${courseId}/quizzes/${quiz.quizId}`}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Sửa
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Không có bài kiểm tra nào.
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Plus className="h-4 w-4 mr-2" /> Tạo bài kiểm tra đầu tiên
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="create">
              {isLoadingCourse ? (
                <div className="text-center py-8">
                  Đang tải thông tin khóa học...
                </div>
              ) : course ? (
                <QuizCreator
                  key={`quiz-creator-${courseId}`}
                  courseId={courseId}
                  sections={formattedSections}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Không có thông tin khóa học
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error rendering CourseQuizzes:", error);
    return (
      <div className="container py-6">
        <div className="text-center p-8">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Đã xảy ra lỗi khi tải trang
          </h2>
          <p className="mb-4">
            Không thể hiển thị trang quản lý bài kiểm tra. Vui lòng thử lại sau.
          </p>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </div>
      </div>
    );
  }
}
