"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  Award,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import PageTitle from "@/components/PageTitle";
import LoadingAlternative from "@/components/LoadingAlternative";
import {
  useGetUserEnrolledCoursesQuery,
  useGetUserProgressSummaryQuery,
  useGetUserQuizResultsQuery,
} from "@/state/api";
import { formatDateString, formatDistanceToNow } from "@/lib/utils";

export default function UserProgressPage() {
  const { userId } = useAuth();
  const router = useRouter();

  const { data: progressSummary, isLoading: isSummaryLoading } =
    useGetUserProgressSummaryQuery(userId as string, { skip: !userId });

  const { data: quizResults, isLoading: isQuizLoading } =
    useGetUserQuizResultsQuery(userId as string, { skip: !userId });

  if (!userId) {
    return <div>Hãy đăng nhập để xem tiến độ học tập của bạn.</div>;
  }

  if (isSummaryLoading || isQuizLoading) {
    return <LoadingAlternative />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageTitle title="Tiến độ học tập của tôi" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Khóa học đã đăng ký
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressSummary?.enrolledCourses || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bài kiểm tra đã hoàn thành
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressSummary?.completedQuizzes || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành tựu</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressSummary?.achievements || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses">Khóa học của tôi</TabsTrigger>
          <TabsTrigger value="quizzes">Bài kiểm tra của tôi</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tiến độ khóa học</CardTitle>
              <CardDescription>
                Xem tiến độ học tập trong khóa học đã đăng ký
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progressSummary?.courseProgress?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khóa học</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead>Tiến độ</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progressSummary.courseProgress.map((course: any) => (
                      <TableRow key={course.courseId}>
                        <TableCell className="font-medium">
                          {course.title}
                        </TableCell>
                        <TableCell>
                          {formatDateString(course.enrollmentDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={course.progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {course.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/user/courses/${course.courseId}`)
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Bạn chưa đăng ký khóa học nào.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => router.push("/user/courses")}
                  >
                    Xem khóa học
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả bài kiểm tra</CardTitle>
              <CardDescription>
                Xem tất cả các bài kiểm tra của bạn và kết quả
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quizResults?.data?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bài kiểm tra</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Hoàn thành</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizResults.data.map((quiz: any) => (
                      <TableRow key={quiz.quizId}>
                        <TableCell className="font-medium">
                          {quiz.courseTitle} - {quiz.quizTitle || "Quiz"}
                        </TableCell>
                        <TableCell>
                          {quiz.score}/{quiz.totalQuestions} (
                          {Math.round((quiz.score / quiz.totalQuestions) * 100)}
                          %)
                        </TableCell>
                        <TableCell>
                          {(() => {
                            try {
                              const date = new Date(quiz.completionDate);
                              if (isNaN(date.getTime())) {
                                return "Thời gian không xác định";
                              }
                              return formatDistanceToNow(date);
                            } catch (error) {
                              console.error("Error formatting date:", error);
                              return "Thời gian không xác định";
                            }
                          })()}
                        </TableCell>
                        <TableCell>
                          {quiz.score / quiz.totalQuestions >= 0.7 ? (
                            <div className="flex items-center text-green-500">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Đã qua
                            </div>
                          ) : (
                            <div className="flex items-center text-amber-500">
                              <Clock className="h-4 w-4 mr-1" />
                              Cần cải thiện
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Bạn chưa hoàn thành bài kiểm tra nào.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => router.push("/user/courses")}
                  >
                    Xem khóa học
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
