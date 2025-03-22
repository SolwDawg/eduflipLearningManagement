"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  FileText,
  Award,
  GraduationCap,
  BarChart,
  AlertCircle,
} from "lucide-react";
import QuizReviewList from "@/components/QuizReviewList";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  getUserProgressSummary,
  ProgressSummary,
} from "@/lib/studentProgressApi";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UserProgressPage() {
  const { user, isLoaded } = useUser();
  const [progressData, setProgressData] = useState<ProgressSummary | null>(
    null
  );
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user) return;

      setIsLoadingProgress(true);
      setError(null);
      try {
        const data = await getUserProgressSummary(user.id);
        setProgressData(data);
      } catch (err) {
        console.error("Error fetching progress data:", err);
        setError("Lỗi tải dữ liệu tiến độ. Vui lòng thử lại sau.");
      } finally {
        setIsLoadingProgress(false);
      }
    };

    if (user) {
      fetchProgressData();
    }
  }, [user]);

  if (!isLoaded || isLoadingProgress) return <Loading />;
  if (!user) return <div>Vui lòng đăng nhập để xem tiến độ của bạn. </div>;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Unknown date";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Tiến độ của tôi"
        subtitle="Theo dõi thành tích học tập của bạn"
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="quizzes" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="overview" className="py-3">
            <GraduationCap className="h-4 w-4 mr-2" />
            Tổng quan học tập
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="py-3">
            <FileText className="h-4 w-4 mr-2" />
            Kết quả bài kiểm tra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  Khóa học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {progressData?.enrolledCourses || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Khóa học đã đăng ký
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-500" />
                  Bài kiểm tra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {progressData?.completedQuizzes || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Bài kiểm tra đã hoàn thành
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Award className="mr-2 h-5 w-5 text-yellow-500" />
                  Thành tích
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {progressData?.achievements || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Thành tích học tập
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Tổng quan tiến độ</CardTitle>
              <CardDescription>
                Trạng thái hoàn thành khóa học trong tất cả các đăng ký
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progressData?.courseProgress &&
              progressData.courseProgress.length > 0 ? (
                <div className="space-y-8">
                  {progressData.courseProgress.map((course) => (
                    <div key={course.courseId}>
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Đăng ký vào {formatDate(course.enrollmentDate)}
                          </p>
                        </div>
                        <span className="font-medium">
                          {Math.round(course.progress)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Không có dữ liệu tiến độ khóa học. Đăng ký khóa học để theo
                    dõi tiến độ của bạn.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
          <QuizReviewList userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
