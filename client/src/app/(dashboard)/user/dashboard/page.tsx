"use client";

import React from "react";
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
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import PageTitle from "@/components/PageTitle";
import LoadingAlternative from "@/components/LoadingAlternative";
import { formatDateString, formatDistanceToNow } from "@/lib/utils";
import { useGetUserDashboardQuery } from "@/state/api";

interface EnrolledCourse {
  courseId: string;
  title: string;
  image: string;
  teacherName: string;
  level: string;
  enrollmentDate: string;
  lastAccessedTimestamp: string | null;
  overallProgress: number;
  totalChapters: number;
  completedChapters: number;
}

interface QuizResult {
  quizId: string;
  quizTitle: string;
  sectionTitle: string;
  courseId: string;
  courseTitle: string;
  score: number;
  passingScore: number;
  passed: boolean;
  completedAt: string;
  timeSpent: number;
}

interface OverallStats {
  totalCourses: number;
  coursesInProgress: number;
  coursesCompleted: number;
  averageScore: number;
}

interface DashboardData {
  enrolledCourses: EnrolledCourse[];
  quizResults: QuizResult[];
  overallStats: OverallStats;
}

export default function UserDashboardPage() {
  const { userId } = useAuth();
  const router = useRouter();

  const { data: dashboard, isLoading } = useGetUserDashboardQuery(
    userId as string,
    { skip: !userId }
  );
  console.log("dashboard raw: ", dashboard);

  if (!userId) {
    return <div>Please log in to view your dashboard.</div>;
  }

  if (isLoading) {
    return <LoadingAlternative />;
  }

  const enrolledCourses = dashboard?.data?.enrolledCourses || [];
  const quizResults = dashboard?.data?.quizResults || [];
  const overallStats = dashboard?.data?.overallStats || {
    totalCourses: 0,
    coursesInProgress: 0,
    coursesCompleted: 0,
    averageScore: 0,
  };

  console.log("Extracted enrolledCourses: ", enrolledCourses);
  console.log("Extracted quizResults: ", quizResults);
  console.log("Extracted overallStats: ", overallStats);

  return (
    <div className="p-6 space-y-6">
      <PageTitle title="Learning Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.totalCourses || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.coursesInProgress || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.coursesCompleted || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.averageScore || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="quizzes">My Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Courses</CardTitle>
              <CardDescription>
                View your progress in all enrolled courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrolledCourses?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Enrolled On</TableHead>
                      <TableHead>Last Accessed</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledCourses.map((course: EnrolledCourse) => (
                      <TableRow key={course.courseId}>
                        <TableCell className="font-medium">
                          {course.title}
                        </TableCell>
                        <TableCell>{course.teacherName}</TableCell>
                        <TableCell>{course.level}</TableCell>
                        <TableCell>
                          {formatDateString(course.enrollmentDate)}
                        </TableCell>
                        <TableCell>
                          {course.lastAccessedTimestamp
                            ? formatDistanceToNow(
                                new Date(course.lastAccessedTimestamp)
                              )
                            : "Not accessed yet"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={course.overallProgress}
                              className="h-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              {course.overallProgress}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {course.completedChapters}/{course.totalChapters}{" "}
                            chapters
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
                    You are not enrolled in any courses yet.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => router.push("/user/courses")}
                  >
                    Browse Courses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Results</CardTitle>
              <CardDescription>
                View all your quiz attempts and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quizResults?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Time Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizResults.map((quiz: QuizResult) => (
                      <TableRow key={quiz.quizId}>
                        <TableCell className="font-medium">
                          {quiz.quizTitle}
                        </TableCell>
                        <TableCell>{quiz.courseTitle}</TableCell>
                        <TableCell>
                          {quiz.score}% ({quiz.passingScore}% to pass)
                        </TableCell>
                        <TableCell>
                          {quiz.passed ? (
                            <div className="flex items-center text-green-500">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Passed
                            </div>
                          ) : (
                            <div className="flex items-center text-red-500">
                              <XCircle className="h-4 w-4 mr-1" />
                              Failed
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(quiz.completedAt))}
                        </TableCell>
                        <TableCell>
                          {Math.floor(quiz.timeSpent / 60)} min{" "}
                          {quiz.timeSpent % 60} sec
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    You haven&apos;t completed any quizzes yet.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => router.push("/user/courses")}
                  >
                    Browse Courses
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
