"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  Loader2,
  Menu,
  X,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import Loading from "@/components/Loading";
import { useCourseProgressData } from "@/hooks/useCourseProgressData";
import ChaptersSidebar from "../../ChaptersSidebar";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import ChapterComments from "@/components/ChapterComments";
import StudentQuizList from "@/components/StudentQuizList";
import PowerPointViewer from "@/components/PowerPointViewer";

// Dynamically import ReactPlayer to reduce initial load time
const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/20">
      <Loader2 className="h-12 w-12 text-primary animate-spin" />
    </div>
  ),
});

// Format Google Meet links
const formatMeetLink = (meetLink: string): string => {
  if (!meetLink) return "";

  // If the link already includes https://, use it as is
  if (meetLink.includes("http")) {
    return meetLink;
  }

  // If it's just a meeting code, format it as a Google Meet URL
  const meetCodeRegex = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
  if (meetCodeRegex.test(meetLink)) {
    return `https://meet.google.com/${meetLink}`;
  }

  // Otherwise, return as is
  return meetLink;
};

const ChapterPage = () => {
  const {
    user,
    courseId,
    course,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    isChapterCompleted,
    updateChapterProgress,
    hasMarkedComplete,
    setHasMarkedComplete,
  } = useCourseProgressData();

  const router = useRouter();
  const playerRef = useRef<any>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleProgress = ({ played }: { played: number }) => {
    if (
      played >= 0.8 &&
      !hasMarkedComplete &&
      currentChapter &&
      currentSection &&
      userProgress?.sections &&
      !isChapterCompleted()
    ) {
      setHasMarkedComplete(true);
      updateChapterProgress(
        currentSection.sectionId,
        currentChapter.chapterId,
        true
      );
    }
  };

  // Find next and previous chapter for navigation
  const findAdjacentChapters = () => {
    if (!course || !currentChapter) return { next: null, prev: null };

    const flatChapters = course.sections.flatMap((section) =>
      section.chapters.map((chapter) => ({
        ...chapter,
        sectionId: section.sectionId,
      }))
    );

    const currentIndex = flatChapters.findIndex(
      (chapter) => chapter.chapterId === currentChapter.chapterId
    );

    return {
      prev: currentIndex > 0 ? flatChapters[currentIndex - 1] : null,
      next:
        currentIndex < flatChapters.length - 1
          ? flatChapters[currentIndex + 1]
          : null,
    };
  };

  const { next, prev } = findAdjacentChapters();

  if (isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view this course.</div>;
  if (!course || !userProgress) return <div>Error loading course</div>;
  if (!currentChapter) return <div>Chapter not found</div>;

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Mobile Sidebar as Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-full max-w-xs sm:max-w-sm">
          <ChaptersSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1 h-full overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>

                <Link href={`/user/courses/${courseId}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Trở lại khóa học</span>
                    <span className="sm:hidden">Trở lại</span>
                  </Button>
                </Link>
              </div>

              {/* Mobile Completion Status */}
              <div className="sm:hidden">
                {isChapterCompleted() ? (
                  <span className="flex items-center text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Đã hoàn thành
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() =>
                      updateChapterProgress(
                        currentSection?.sectionId || "",
                        currentChapter.chapterId,
                        true
                      )
                    }
                  >
                    Đánh dấu hoàn thành
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop Completion Status */}
            <div className="hidden sm:flex items-center">
              {isChapterCompleted() ? (
                <span className="flex items-center text-xs md:text-sm font-medium text-green-500 bg-green-50 px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                  <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5" />
                  Đã hoàn thành
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                  onClick={() =>
                    updateChapterProgress(
                      currentSection?.sectionId || "",
                      currentChapter.chapterId,
                      true
                    )
                  }
                >
                  Đánh dấu hoàn thành
                </Button>
              )}
            </div>
          </header>

          <div className="mb-4 sm:mb-5 md:mb-6">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
              {currentChapter.title}
            </h1>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {course.title} / {currentSection?.sectionTitle}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 sm:h-8 w-1/3" />
                <Skeleton className="h-60 sm:h-80 md:h-96 w-full" />
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                {course?.meetLink && (
                  <div className="mb-2 sm:mb-3 md:mb-4 p-2 sm:p-3 md:p-4 border rounded-md bg-blue-50 dark:bg-blue-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <LinkIcon
                        size={16}
                        className="text-primary-700 flex-shrink-0"
                      />
                      <span className="text-xs sm:text-sm">
                        Tham gia phòng học ảo của khóa học này với giáo viên
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-primary-700 border-primary-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 whitespace-nowrap text-xs sm:text-sm h-7 sm:h-8"
                      onClick={() => {
                        window.open(
                          formatMeetLink(course.meetLink || ""),
                          "_blank"
                        );
                        toast.success("Đang mở Google Meet trong tab mới");
                      }}
                    >
                      Tham gia cuộc họp{" "}
                      <ExternalLink className="ml-1" size={12} />
                    </Button>
                  </div>
                )}

                <div className="mb-4 sm:mb-5 md:mb-6">
                  {currentChapter?.type === "Video" && currentChapter.video ? (
                    <div className="relative aspect-video overflow-hidden rounded-md sm:rounded-lg border mb-3 sm:mb-4">
                      <ReactPlayer
                        className="react-player"
                        url={currentChapter.video as string}
                        width="100%"
                        height="100%"
                        controls
                        onProgress={handleProgress}
                        ref={playerRef}
                      />
                    </div>
                  ) : null}

                  {currentChapter?.presentation ? (
                    <div className="mt-3 sm:mt-4">
                      <div className="relative overflow-hidden rounded-md sm:rounded-lg border">
                        <PowerPointViewer
                          fileUrl={currentChapter.presentation as string}
                          height={400}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <Tabs defaultValue="content" className="mb-4 sm:mb-6 md:mb-8">
                  <TabsList className="mb-3 sm:mb-4 w-full justify-start border-b pb-px bg-transparent overflow-x-auto">
                    <TabsTrigger
                      value="content"
                      className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
                    >
                      Nội dung
                    </TabsTrigger>
                    <TabsTrigger
                      value="resources"
                      className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
                    >
                      Tài liệu
                    </TabsTrigger>
                    <TabsTrigger
                      value="quizzes"
                      className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
                    >
                      Bài kiểm tra
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs sm:text-sm"
                    >
                      Bình luận
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="content"
                    className="prose prose-xs sm:prose-sm md:prose prose-slate max-w-none dark:prose-invert prose-img:rounded-lg prose-headings:font-bold prose-a:text-primary"
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          currentChapter.content ||
                          "<p>No content available for this chapter.</p>",
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="resources">
                    <Card className="border border-border/50 shadow-sm">
                      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                        <CardTitle className="text-sm sm:text-base flex items-center">
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2 text-primary" />
                          Tài liệu
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                        {currentChapter.resources?.length ? (
                          <ul className="space-y-1.5 sm:space-y-2 md:space-y-3">
                            {currentChapter.resources.map(
                              (resource: any, index: any) => (
                                <li
                                  key={index}
                                  className="border-b border-border/30 pb-1.5 sm:pb-2 md:pb-3 last:border-0 last:pb-0"
                                >
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center text-xs sm:text-sm"
                                  >
                                    <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                                    <span>{resource.title}</span>
                                  </a>
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-xs sm:text-sm">
                            Không có tài liệu nào cho chương này.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="quizzes">
                    <StudentQuizList
                      courseId={courseId as string}
                      sectionId={currentSection?.sectionId}
                      chapterId={currentChapter.chapterId}
                    />
                  </TabsContent>

                  <TabsContent value="comments">
                    <ChapterComments
                      courseId={courseId as string}
                      sectionId={currentSection?.sectionId || ""}
                      chapterId={currentChapter.chapterId}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between items-center mt-4 sm:mt-6 md:mt-8 border-t pt-3 sm:pt-4 md:pt-6">
                  {prev ? (
                    <Button
                      variant="outline"
                      className="shadow-sm text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 md:px-4"
                      onClick={() =>
                        router.push(
                          `/user/courses/${courseId}/chapters/${prev.chapterId}`
                        )
                      }
                    >
                      <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                      Trước
                    </Button>
                  ) : (
                    <div />
                  )}

                  {next ? (
                    <Button
                      className="shadow-sm text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 md:px-4"
                      onClick={() =>
                        router.push(
                          `/user/courses/${courseId}/chapters/${next.chapterId}`
                        )
                      }
                    >
                      Tiếp theo
                      <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ml-1 sm:ml-1.5 md:ml-2" />
                    </Button>
                  ) : (
                    <Button
                      className="shadow-sm text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 md:px-4"
                      onClick={() => router.push(`/user/courses/${courseId}`)}
                    >
                      Hoàn tất khóa học
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterPage;
