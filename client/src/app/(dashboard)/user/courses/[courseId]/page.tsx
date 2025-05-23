"use client";

import { useGetCourseQuery, useGetUserCourseProgressQuery } from "@/state/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  BookOpen,
  CheckCircle,
  Link,
  ExternalLink,
  Copy,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Loading from "@/components/Loading";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StudentQuizList from "@/components/StudentQuizList";
import ChaptersSidebar from "./ChaptersSidebar";

// Add a helper function to format the meeting link
const formatMeetLink = (meetLink: string): string => {
  // If the link already includes https://, use it as is
  if (meetLink.includes("http")) {
    return meetLink;
  }

  // If it's just a meeting code, format it as a Google Meet URL
  // Format: xxx-xxxx-xxx
  const meetCodeRegex = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
  if (meetCodeRegex.test(meetLink)) {
    return `https://meet.google.com/${meetLink}`;
  }

  // Otherwise, return as is
  return meetLink;
};

export default function CourseView() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();

  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useGetCourseQuery(courseId as string);

  const {
    data: progress,
    isLoading: isLoadingProgress,
    error: progressError,
  } = useGetUserCourseProgressQuery(
    { userId: user?.id || "", courseId: courseId as string },
    { skip: !user?.id }
  );

  // Redirect to the first chapter if the user is enrolled
  const handleStartLearning = () => {
    if (course?.sections && course.sections.length > 0) {
      const firstSection = course.sections[0];
      if (firstSection.chapters && firstSection.chapters.length > 0) {
        const firstChapter = firstSection.chapters[0];
        router.push(
          `/user/courses/${courseId}/chapters/${firstChapter.chapterId}`
        );
      }
    }
  };

  if (!isUserLoaded) return <Loading />;

  if (!user) {
    router.push("/signin");
    return null;
  }

  if (isLoadingCourse || (user && isLoadingProgress)) {
    return <Loading />;
  }

  if (courseError || !course) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Khóa học không tồn tại</h1>
          <p className="mb-6">
            Khoá học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <Button onClick={() => router.push("/user/courses")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại khóa học của tôi
          </Button>
        </div>
      </div>
    );
  }

  if (progressError) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lỗi đăng ký</h1>
          <p className="mb-6">Bạn không có quyền truy cập vào khóa học này.</p>
          <Button onClick={() => router.push("/courses")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Xem khóa học
          </Button>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const totalChapters =
    course.sections?.reduce(
      (acc, section) => acc + section.chapters.length,
      0
    ) || 0;

  const completedChapters = progress?.completedChapters?.length || 0;
  const progressPercentage =
    totalChapters > 0
      ? Math.round((completedChapters / totalChapters) * 100)
      : 0;

  return (
    <div className="container mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/user/courses")}
        className="mb-4 sm:mb-6"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        <span className="text-sm sm:text-base">Quay lại khóa học của tôi</span>
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">
            {course.title}
          </h1>
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={course.teacherName} />
              <AvatarFallback>{course.teacherName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm sm:text-base">{course.teacherName}</span>
          </div>

          {course.meetLink && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 border rounded-md bg-blue-50 dark:bg-blue-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-700 text-white rounded-md flex-shrink-0">
                  <Link size={18} className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm sm:text-base">
                    Phòng học ảo
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Giáo viên đã tạo phòng học ảo cho khóa học này
                  </p>
                </div>
              </div>
              <Button
                onClick={() =>
                  window.open(formatMeetLink(course.meetLink || ""), "_blank")
                }
                className="bg-primary-700 hover:bg-primary-600 whitespace-nowrap text-sm"
                size="sm"
              >
                Tham gia lớp
              </Button>
            </div>
          )}

          <div className="relative aspect-video rounded-lg overflow-hidden mb-6 sm:mb-8">
            <Image
              src={course.image || "/placeholder.png"}
              alt={course.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
              Giới thiệu khóa học
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {course.description}
            </p>
          </div>

          <Separator className="my-6 sm:my-8" />

          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
              Nội dung khóa học
            </h2>

            {/* Add course-level quizzes */}
            <div className="mb-6">
              <StudentQuizList courseId={courseId as string} />
            </div>

            <div className="space-y-4 sm:space-y-6">
              {course.sections?.map((section, i) => (
                <Card key={section.sectionId} className="overflow-hidden">
                  <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">
                      Chương {i + 1}: {section.sectionTitle}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {section.sectionDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3">
                    <ul className="space-y-1 sm:space-y-2">
                      {section.chapters.map((chapter, j) => {
                        const isCompleted =
                          progress?.completedChapters?.includes(
                            chapter.chapterId
                          );

                        return (
                          <li
                            key={chapter.chapterId}
                            className="flex justify-between items-center p-2 sm:p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
                            onClick={() =>
                              router.push(
                                `/user/courses/${courseId}/chapters/${chapter.chapterId}`
                              )
                            }
                          >
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className="text-sm sm:text-base">
                                {j + 1}. {chapter.title}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Add section-level quizzes */}
                    <div className="mt-4">
                      <StudentQuizList
                        courseId={courseId as string}
                        sectionId={section.sectionId}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-1 order-first md:order-last mb-6 md:mb-0">
          <Card className="sticky top-20">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                Tiến độ học tập
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {completedChapters}/{totalChapters} chương đã hoàn thành
                  </span>
                  <span className="text-xs sm:text-sm font-medium">
                    {progressPercentage}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {course.meetLink && (
                <div className="py-3 border rounded-lg p-3 bg-blue-50 dark:bg-blue-950/30">
                  <h3 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Link size={14} className="text-primary-700" />
                    Phòng học ảo
                  </h3>
                  <div className="flex flex-col gap-2">
                    <a
                      href={formatMeetLink(course.meetLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm bg-primary-700 text-white py-2 px-3 rounded-md flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors"
                    >
                      Tham gia Google Meet
                      <ExternalLink
                        size={12}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-gray-500 flex-1 truncate">
                        {formatMeetLink(course.meetLink)}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  formatMeetLink(course.meetLink || "")
                                );
                                toast.success(
                                  "Liên kết Google Meet đã được sao chép vào bộ nhớ"
                                );
                              }}
                              className="h-7 w-7 sm:h-8 sm:w-8 text-primary-700"
                            >
                              <Copy
                                size={14}
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Sao chép liên kết</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleStartLearning}
                className="w-full mt-4 text-sm"
              >
                {completedChapters > 0 ? "Tiếp tục học tập" : "Bắt đầu học tập"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
