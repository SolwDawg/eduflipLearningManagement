"use client";

import { useGetCourseQuery, useEnrollCourseMutation } from "@/state/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Loading from "@/components/Loading";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import StudentQuizList from "@/components/StudentQuizList";
import { BookCheck } from "lucide-react";

export default function CoursePreviewPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const {
    data: course,
    isLoading,
    error,
  } = useGetCourseQuery(courseId as string);

  const [enrollCourse, { isLoading: isEnrolling }] = useEnrollCourseMutation();

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để tham gia khoá học");
      router.push("/sign-in");
      return;
    }

    try {
      // Use the enrollment mutation
      await enrollCourse({
        userId: user.id,
        courseId: courseId as string,
      }).unwrap();

      toast.success("Tham gia khoá học thành công!");
      router.push(`/user/courses/${courseId}`);
    } catch (error) {
      console.error("Lỗi tham gia khoá học:", error);
      toast.error("Không thể tham gia khoá học. Vui lòng thử lại.");
    }
  };

  if (isLoading) return <Loading />;

  if (error || !course) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Khoá học không tồn tại</h1>
          <p className="mb-6">Khoá học của bạn không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={() => router.push("/courses")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại khoá học
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Quay lại
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          <div className="flex items-center gap-2 mb-6">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={course.teacherName} />
              <AvatarFallback>{course.teacherName[0]}</AvatarFallback>
            </Avatar>
            <span>{course.teacherName}</span>
          </div>

          <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
            <Image
              src={course.image || "/placeholder.png"}
              alt={course.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Giới thiệu khoá học</h2>
            <p className="text-muted-foreground">{course.description}</p>
          </div>

          <Separator className="my-8" />

          <div>
            <h2 className="text-2xl font-semibold mb-4">Nội dung khoá học</h2>

            {/* Show quizzes if any */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BookCheck className="text-primary h-5 w-5" />
                <h3 className="text-lg font-medium">Bài kiểm tra có sẵn</h3>
              </div>
              <StudentQuizList courseId={courseId as string} />
            </div>

            <div className="space-y-4">
              {course.sections?.map((section, i) => (
                <Card key={section.sectionId}>
                  <CardHeader>
                    <CardTitle>
                      Chương {i + 1}: {section.sectionTitle}
                    </CardTitle>
                    <CardDescription>
                      {section.sectionDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.chapters.map((chapter, j) => (
                        <li
                          key={chapter.chapterId}
                          className="flex justify-between items-center p-2 rounded hover:bg-muted"
                        >
                          <span>
                            {j + 1}. {chapter.title}
                          </span>
                          {chapter.freePreview ? (
                            <span className="text-xs bg-primary-500/20 text-primary-500 py-1 px-2 rounded"></span>
                          ) : (
                            <span className="text-xs bg-muted py-1 px-2 rounded"></span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Thông tin khoá học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Cấp độ</h3>
                <p className="text-muted-foreground">{course.level}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Nội dung</h3>
                <p className="text-muted-foreground">
                  {course.sections?.length || 0} chương &bull;
                  {course.sections?.reduce(
                    (acc, section) => acc + section.chapters.length,
                    0
                  ) || 0}{" "}
                  bài học
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleEnroll}
                className="w-full"
                disabled={isEnrolling}
              >
                {isEnrolling ? "Đang tham gia..." : "Tham gia khoá học"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
