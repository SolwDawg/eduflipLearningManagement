"use client";

import { useState, useEffect } from "react";
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

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="existing">Bài kiểm tra hiện có</TabsTrigger>
          <TabsTrigger value="create">Tạo bài kiểm tra</TabsTrigger>
        </TabsList>

        <TabsContent value="existing">
          {isLoadingQuizzes ? (
            <div className="text-center py-8">Đang tải bài kiểm tra...</div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Card key={quiz.quizId}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>{getScopeDisplay(quiz)}</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
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
              <Button
                onClick={() =>
                  router.push(`/teacher/courses/${courseId}/quizzes`)
                }
              >
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
            <QuizCreator courseId={courseId} sections={formattedSections} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Không có thông tin khóa học
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
