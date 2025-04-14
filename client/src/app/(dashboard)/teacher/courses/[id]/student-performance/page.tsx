"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetDetailedCourseStudentPerformanceQuery,
  useGetCourseQuery,
} from "@/state/api";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  Clock,
  Loader2,
  MessagesSquare,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Color constants for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const PARTICIPATION_COLORS = {
  High: "#047857", // Emerald-700
  Medium: "#059669", // Emerald-600
  Low: "#0EA5E9", // Sky-500
  None: "#E11D48", // Rose-600
};

const StudentPerformancePage = () => {
  const params = useParams();
  const courseId = params.id as string;
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: courseData,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useGetCourseQuery(courseId);

  const {
    data: performanceData,
    isLoading: isLoadingPerformance,
    error: performanceError,
    refetch,
  } = useGetDetailedCourseStudentPerformanceQuery(courseId);

  const isLoading = isLoadingCourse || isLoadingPerformance;

  if (isLoading) {
    return (
      <div className="h-full flex justify-center items-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary-600" />
      </div>
    );
  }

  if (performanceError || courseError) {
    return (
      <div className="h-full flex flex-col justify-center items-center">
        <div className="text-center space-y-5">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">
            {performanceError?.data?.message ||
              courseError?.data?.message ||
              "Failed to load student performance data. Please try again later."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => refetch()}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href={`/teacher/courses/${courseId}`}>Back to course</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!performanceData || performanceData.enrollmentCount === 0) {
    return (
      <div className="h-full flex flex-col justify-center items-center">
        <div className="text-center space-y-5">
          <BookOpen className="h-16 w-16 text-primary-600 mx-auto" />
          <h2 className="text-2xl font-semibold">
            No student performance data available
          </h2>
          <p className="text-muted-foreground max-w-md">
            {"This course doesn't have any enrolled students yet."}
          </p>
          <Button asChild>
            <Link href={`/teacher/courses/${courseId}`}>Back to course</Link>
          </Button>
        </div>
      </div>
    );
  }

  const data = performanceData;

  // Filter student details based on search term
  const filteredStudents = data.students.filter(
    (student: any) =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare data for charts - participation levels
  const participationLevelData = [
    { name: "High", value: 0 },
    { name: "Medium", value: 0 },
    { name: "Low", value: 0 },
    { name: "None", value: 0 },
  ];

  // Count students by participation level
  data.students.forEach((student: any) => {
    const level = student.participationLevel;
    const existingLevel = participationLevelData.find(
      (item: any) => item.name === level
    );
    if (existingLevel) {
      existingLevel.value++;
    }
  });

  // Prepare quiz completion data
  const quizCompletionData = [
    { name: "Completed", value: data.studentsWithQuizzesCount },
    {
      name: "Not Completed",
      value: data.enrollmentCount - data.studentsWithQuizzesCount,
    },
  ];

  return (
    <div className="dashboard-container">
      <Header
        title="Student Performance Analysis"
        subtitle={courseData?.title || "Course not found"}
      />

      <Tabs
        defaultValue="overview"
        className="space-y-4"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="quizzes">Quiz Performance</TabsTrigger>
          <TabsTrigger value="discussions">Discussion Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Course Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-lg font-medium">
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-6 w-6 mr-2 text-primary-600" />
                  <span className="text-3xl font-bold">
                    {data.enrollmentCount}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-lg font-medium">
                  Active Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-primary-600" />
                  <span className="text-3xl font-bold">
                    {data.activeStudentsCount}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">
                    {data.courseActivityRate}% activity rate
                  </span>
                  <Progress value={data.courseActivityRate} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-lg font-medium">
                  Quiz Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                  <span className="text-3xl font-bold">
                    {data.studentsWithQuizzesCount}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">
                    {data.quizCompletionRate}% completion rate
                  </span>
                  <Progress value={data.quizCompletionRate} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-lg font-medium">
                  Active Discussions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <MessagesSquare className="h-6 w-6 mr-2 text-blue-600" />
                  <span className="text-3xl font-bold">
                    {data.students.reduce(
                      (total: number, student: any) =>
                        total + student.totalDiscussionPosts,
                      0
                    )}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground block mt-2">
                  Total posts from all students
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Participation Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={participationLevelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {participationLevelData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              PARTICIPATION_COLORS[
                                entry.name as keyof typeof PARTICIPATION_COLORS
                              ] || COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quiz Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={quizCompletionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#00C49F" />
                        <Cell fill="#FF8042" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Student List ({data.students.length})</CardTitle>
                <div className="w-full md:w-64">
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead>Last Access</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Participation</TableHead>
                      <TableHead>Quiz Avg.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No students found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student: any) => (
                        <TableRow key={student.userId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    student.fullName
                                  )}&background=random`}
                                  alt={student.fullName}
                                />
                                <AvatarFallback>
                                  {student.fullName
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {student.fullName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              student.enrollmentDate
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {student.lastAccessDate
                              ? formatDistanceToNow(
                                  new Date(student.lastAccessDate),
                                  { addSuffix: true, locale: vi }
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">
                                  {student.overallProgress}%
                                </span>
                              </div>
                              <Progress
                                value={student.overallProgress}
                                className="h-2"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                student.participationLevel === "High"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : student.participationLevel === "Medium"
                                  ? "bg-blue-100 text-blue-800"
                                  : student.participationLevel === "Low"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }
                            >
                              {student.participationLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {student.hasCompletedQuizzes
                              ? `${student.averageQuizScore}%`
                              : "No quizzes"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Performance Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.students
                      .filter((s: any) => s.hasCompletedQuizzes)
                      .map((s: any) => ({
                        name: s.fullName,
                        score: s.averageQuizScore,
                      }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      label={{
                        value: "Average Score (%)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Quizzes Completed</TableHead>
                    <TableHead>Average Score</TableHead>
                    <TableHead>Best Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students
                    .filter((s: any) => s.hasCompletedQuizzes)
                    .sort(
                      (a: any, b: any) =>
                        b.averageQuizScore - a.averageQuizScore
                    )
                    .map((student: any) => {
                      // Find the quiz with highest score percentage
                      const bestQuiz = student.completedQuizzes.reduce(
                        (best: any, current: any) =>
                          current.scorePercentage > (best?.scorePercentage || 0)
                            ? current
                            : best,
                        student.completedQuizzes[0]
                      );

                      return (
                        <TableRow key={student.userId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    student.fullName
                                  )}&background=random`}
                                  alt={student.fullName}
                                />
                                <AvatarFallback>
                                  {student.fullName
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {student.fullName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.totalQuizzesCompleted} of{" "}
                            {/* Assuming all quizzes in the course are the same */}
                            {
                              data.students
                                .flatMap((s: any) => s.completedQuizzes)
                                .filter(
                                  (quiz: any, index: number, self: any) =>
                                    index ===
                                    self.findIndex(
                                      (q: any) => q.quizId === quiz.quizId
                                    )
                                ).length
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={student.averageQuizScore}
                                className="w-24"
                              />
                              <span>{student.averageQuizScore}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {bestQuiz ? (
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {bestQuiz.title}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {bestQuiz.score}/{bestQuiz.totalQuestions} (
                                  {bestQuiz.scorePercentage}%)
                                </span>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discussion Activity Tab */}
        <TabsContent value="discussions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discussion Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Total Posts</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Discussions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.students
                      .filter((s: any) => s.totalDiscussionPosts > 0)
                      .sort(
                        (a: any, b: any) =>
                          b.totalDiscussionPosts - a.totalDiscussionPosts
                      )
                      .map((student: any) => (
                        <TableRow key={student.userId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    student.fullName
                                  )}&background=random`}
                                  alt={student.fullName}
                                />
                                <AvatarFallback>
                                  {student.fullName
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {student.fullName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{student.totalDiscussionPosts}</TableCell>
                          <TableCell>
                            {student.discussionActivity.length > 0
                              ? formatDistanceToNow(
                                  new Date(
                                    student.discussionActivity.reduce(
                                      (latest: any, current: any) =>
                                        new Date(current.lastActivityDate) >
                                        new Date(latest.lastActivityDate)
                                          ? current
                                          : latest,
                                      student.discussionActivity[0]
                                    ).lastActivityDate
                                  ),
                                  { addSuffix: true, locale: vi }
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {student.discussionActivity.length} discussion
                            {student.discussionActivity.length === 1 ? "" : "s"}
                          </TableCell>
                        </TableRow>
                      ))}
                    {data.students.filter(
                      (s: any) => s.totalDiscussionPosts > 0
                    ).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No discussion activity found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentPerformancePage;
