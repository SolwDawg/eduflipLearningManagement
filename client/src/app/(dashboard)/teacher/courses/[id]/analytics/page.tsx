"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetCourseProgressAnalyticsQuery,
  useGetCourseQuery,
} from "@/state/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  AlertCircle,
  BookOpen,
  BookOpenCheck,
  CheckCircle,
  Clock,
  Loader2,
  MessagesSquare,
  Timer,
  Users,
  Zap,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Color constants for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const PARTICIPATION_COLORS = {
  high: "#047857", // Emerald-700
  medium: "#059669", // Emerald-600
  low: "#0EA5E9", // Sky-500
  none: "#E11D48", // Rose-600
};

const AnalyticsPage = () => {
  const params = useParams();
  const courseId = params.id as string;
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: courseData,
    isLoading: isLoadingCourse,
    error: courseError,
    refetch: refetchCourse,
  } = useGetCourseQuery(courseId);
  const {
    data: analyticsResponse,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
    refetch,
  } = useGetCourseProgressAnalyticsQuery(courseId);

  const isLoading = isLoadingCourse || isLoadingAnalytics;

  if (isLoadingAnalytics || isLoadingCourse) {
    return (
      <div className="h-full flex justify-center items-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary-600" />
      </div>
    );
  }

  if (analyticsError || courseError) {
    return (
      <div className="h-full flex flex-col justify-center items-center">
        <div className="text-center space-y-5">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">
            {analyticsError?.data?.message ||
              courseError?.data?.message ||
              "Failed to load analytics data. Please try again later."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                refetch();
                if (courseError) refetchCourse();
              }}
            >
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/teacher/courses/${courseId}`}>Back to course</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (
    !analyticsResponse?.data ||
    analyticsResponse?.data?.totalStudents === 0
  ) {
    return (
      <div className="h-full flex flex-col justify-center items-center">
        <div className="text-center space-y-5">
          <BookOpen className="h-16 w-16 text-primary-600 mx-auto" />
          <h2 className="text-2xl font-semibold">
            No analytics data available
          </h2>
          <p className="text-muted-foreground max-w-md">
            {analyticsResponse?.message ||
              "This course doesn't have any enrolled students or analytics data yet."}
          </p>
          <Button asChild>
            <Link href={`/teacher/courses/${courseId}`}>Back to course</Link>
          </Button>
        </div>
      </div>
    );
  }

  const analytics = analyticsResponse?.data;

  // Prepare data for charts
  const participationData = [
    {
      name: "Cao",
      value: analytics.discussionData.participationLevels.high,
      color: PARTICIPATION_COLORS.high,
    },
    {
      name: "Trung bình",
      value: analytics.discussionData.participationLevels.medium,
      color: PARTICIPATION_COLORS.medium,
    },
    {
      name: "Thấp",
      value: analytics.discussionData.participationLevels.low,
      color: PARTICIPATION_COLORS.low,
    },
    {
      name: "Không tham gia",
      value: analytics.discussionData.participationLevels.none,
      color: PARTICIPATION_COLORS.none,
    },
  ];

  // Filter student details based on search term
  const filteredStudents = analytics.studentDetails.filter((student) =>
    student.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Header
        title="Phân tích quá trình học tập"
        subtitle={courseData?.title || "Không tìm thấy khóa học"}
      />

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-800 text-lg font-medium">
              Tổng số học sinh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-8 h-8 text-primary-600 mr-3" />
              <span className="text-3xl font-bold text-primary-800">
                {analytics.totalStudents}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-800 text-lg font-medium">
              Tiến độ trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-2">
              <BookOpenCheck className="w-8 h-8 text-primary-600 mr-3" />
              <span className="text-3xl font-bold text-primary-800">
                {analytics.averageProgress.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={analytics.averageProgress}
              className="h-2 bg-primary-100"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-800 text-lg font-medium">
              Điểm quiz trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-2">
              <CheckCircle className="w-8 h-8 text-primary-600 mr-3" />
              <span className="text-3xl font-bold text-primary-800">
                {analytics.quizData.averageScore.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={analytics.quizData.averageScore}
              className="h-2 bg-primary-100"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="material">Tài liệu học tập</TabsTrigger>
          <TabsTrigger value="quiz">Kết quả quiz</TabsTrigger>
          <TabsTrigger value="discussion">Thảo luận</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary-800">
                  Phân phối tiến độ học tập
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Tài liệu",
                        value:
                          analytics.materialAccessData
                            .averageAccessesPerStudent,
                      },
                      {
                        name: "Quiz",
                        value:
                          ((analytics.totalStudents -
                            analytics.quizData.studentsWithNoQuizzes) /
                            analytics.totalStudents) *
                          100,
                      },
                      {
                        name: "Thảo luận",
                        value: analytics.discussionData.averagePostsPerStudent,
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Giá trị trung bình"
                      fill="#3b82f6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Participation Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary-800">
                  Mức độ tham gia thảo luận
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={participationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {participationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Material Tab */}
        <TabsContent value="material" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-sm font-medium">
                  Tổng số truy cập
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Zap className="w-6 h-6 text-primary-600 mr-2" />
                  <span className="text-2xl font-bold text-primary-800">
                    {analytics.materialAccessData.totalAccesses}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-sm font-medium">
                  Truy cập trung bình
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-primary-600 mr-2" />
                  <span className="text-2xl font-bold text-primary-800">
                    {analytics.materialAccessData.averageAccessesPerStudent.toFixed(
                      1
                    )}{" "}
                    lần/học sinh
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-sm font-medium">
                  Học sinh chưa truy cập
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                  <span className="text-2xl font-bold text-primary-800">
                    {analytics.materialAccessData.studentsWithNoAccess} học sinh
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary-800">
                Biểu đồ truy cập tài liệu học tập
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.studentDetails
                    .sort((a, b) => b.materialAccesses - a.materialAccesses)
                    .slice(0, 10)
                    .map((student) => ({
                      userId: student.userId,
                      accesses: student.materialAccesses,
                    }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userId" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="accesses"
                    name="Số lần truy cập"
                    fill="#0891b2"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-sm font-medium">
                  Điểm trung bình
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-6 h-6 text-primary-600 mr-2" />
                  <span className="text-2xl font-bold text-primary-800">
                    {analytics.quizData.averageScore.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={analytics.quizData.averageScore}
                  className="h-2 bg-primary-100"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-sm font-medium">
                  Tỷ lệ hoàn thành
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <BookOpenCheck className="w-6 h-6 text-primary-600 mr-2" />
                  <span className="text-2xl font-bold text-primary-800">
                    {analytics.quizData.completionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={analytics.quizData.completionRate}
                  className="h-2 bg-primary-100"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-sm font-medium">
                  Chưa làm quiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                  <span className="text-2xl font-bold text-primary-800">
                    {analytics.quizData.studentsWithNoQuizzes} học sinh
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary-800">
                Điểm số quiz theo học sinh
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.studentDetails
                    .filter((student) => student.quizAverage > 0)
                    .sort((a, b) => b.quizAverage - a.quizAverage)
                    .slice(0, 10)
                    .map((student) => ({
                      userId: student.userId,
                      score: student.quizAverage,
                    }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userId" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="score"
                    name="Điểm trung bình (%)"
                    fill="#059669"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discussion Tab */}
        <TabsContent value="discussion" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-sm font-medium">
                  Tổng số bài viết
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <MessagesSquare className="w-6 h-6 text-primary-600 mr-2" />
                  <span className="text-2xl font-bold text-primary-800">
                    {analytics.discussionData.totalPosts}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-sm font-medium">
                  Bài viết trung bình
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-primary-600 mr-2" />
                  <span className="text-2xl font-bold text-primary-800">
                    {analytics.discussionData.averagePostsPerStudent.toFixed(1)}{" "}
                    bài/học sinh
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary-800 text-sm font-medium">
                  Mức độ tham gia cao
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Zap className="w-6 h-6 text-green-600 mr-2" />
                  <span className="text-2xl font-bold text-primary-800">
                    {analytics.discussionData.participationLevels.high} học sinh
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary-800">
                  Mức độ tham gia thảo luận
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={participationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {participationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary-800">
                  Chi tiết tham gia thảo luận
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    analytics.discussionData.participationLevels
                  ).map(([level, count]) => (
                    <div
                      key={level}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor:
                              PARTICIPATION_COLORS[
                                level as keyof typeof PARTICIPATION_COLORS
                              ],
                          }}
                        />
                        <span className="text-primary-700 capitalize">
                          {level === "high"
                            ? "Cao"
                            : level === "medium"
                            ? "Trung bình"
                            : level === "low"
                            ? "Thấp"
                            : "Không tham gia"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-primary-800 font-medium mr-2">
                          {count} học sinh
                        </span>
                        <span className="text-primary-600 text-sm">
                          (
                          {((count / analytics.totalStudents) * 100).toFixed(1)}
                          %)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Student Details Table */}
      <div className="my-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-primary-800">
            Chi tiết theo học sinh
          </h2>
          <div className="relative w-72">
            <Input
              type="text"
              placeholder="Tìm kiếm theo ID học sinh..."
              className="pl-10 bg-white border-primary-200 text-primary-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500">
              <Users className="h-4 w-4" />
            </span>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary-700">
                    ID Học sinh
                  </TableHead>
                  <TableHead className="text-primary-700">Tiến độ</TableHead>
                  <TableHead className="text-primary-700">
                    Truy cập tài liệu
                  </TableHead>
                  <TableHead className="text-primary-700">Điểm quiz</TableHead>
                  <TableHead className="text-primary-700">
                    Mức độ tham gia
                  </TableHead>
                  <TableHead className="text-primary-700">
                    Hoạt động gần đây
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.userId}>
                      <TableCell className="font-medium text-primary-800">
                        {student.userId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={student.progress}
                            className="w-20 h-2 bg-primary-100"
                          />
                          <span className="text-primary-700">
                            {student.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-primary-700">
                        {student.materialAccesses} lần
                      </TableCell>
                      <TableCell className="text-primary-700">
                        {student.quizAverage.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`
                            ${
                              student.participationLevel.toLowerCase() ===
                              "high"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : student.participationLevel.toLowerCase() ===
                                  "medium"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : student.participationLevel.toLowerCase() ===
                                  "low"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          `}
                        >
                          {student.participationLevel === "High"
                            ? "Cao"
                            : student.participationLevel === "Medium"
                            ? "Trung bình"
                            : student.participationLevel === "Low"
                            ? "Thấp"
                            : "Không"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary-600">
                        {formatDistanceToNow(new Date(student.lastAccessed), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-primary-600"
                    >
                      {searchTerm
                        ? `Không tìm thấy học sinh phù hợp với "${searchTerm}".`
                        : "Không có dữ liệu học sinh."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
