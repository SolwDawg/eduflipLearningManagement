"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ChevronDown,
  MoreVertical,
  Search,
  BarChart,
  MessageSquare,
  Users,
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  User,
  Trophy,
} from "lucide-react";
// import PageTitle from "@/components/PageTitle";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StudentProgressAnalytics,
  StudentProgressSummary,
  fetchCourseProgressAnalytics,
} from "@/lib/studentProgressApi";
import { format } from "date-fns";

interface Student {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  progress: number;
  courseProgress: number;
  completedChapters: number;
  totalChapters: number;
  chaptersCompleted: number;
  totalTime: number;
  lastActivity: string;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  score: number;
  rank: number;
}

interface Course {
  id: string;
  title: string;
}

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  courseProgress: number;
  lastActivity: string;
  chaptersCompleted: number;
  totalTime: number;
}

interface ChartData {
  labels: string[];
  values: number[];
}

// Default analytics object with empty values to use when API fails
const createDefaultAnalytics = (
  courseId: string
): StudentProgressAnalytics => ({
  totalStudents: 0,
  averageProgress: 0,
  materialAccessData: {
    totalAccesses: 0,
    averageAccessesPerStudent: 0,
    studentsWithNoAccess: 0,
  },
  quizData: {
    averageScore: 0,
    studentsWithNoQuizzes: 0,
    completionRate: 0,
  },
  discussionData: {
    totalPosts: 0,
    averagePostsPerStudent: 0,
    participationLevels: { high: 0, medium: 0, low: 0, none: 0 },
  },
  studentDetails: [],
});

const CourseProgressPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [analytics, setAnalytics] = useState<StudentProgressAnalytics | null>(
    null
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course details
        try {
          const courseResponse = await axios.get(
            `/api/teacher/courses/${courseId}`
          );
          setCourse(courseResponse.data);
        } catch (courseError) {
          console.error("Could not fetch course details:", courseError);
          setCourse({ id: courseId, title: "Course Details" });
        }

        // Fetch all students and their progress for this course
        const studentsResponse = await axios.get(
          `/api/courses/${courseId}/progress`
        );

        if (studentsResponse.data && Array.isArray(studentsResponse.data)) {
          setStudents(studentsResponse.data);
          setFilteredStudents(studentsResponse.data);
        } else {
          console.error("Invalid student progress data format");
          setError("Received invalid student progress data");
          setStudents([]);
          setFilteredStudents([]);
        }

        // Fetch analytics data - prioritize real data
        try {
          const analyticsResponse = await axios.get(
            `/api/progress/analytics/course/${courseId}`
          );

          if (analyticsResponse.data && analyticsResponse.data.data) {
            console.log("Using real analytics data from backend");
            setAnalytics(analyticsResponse.data.data);
          } else {
            console.warn(
              "Backend returned empty analytics, using placeholder data"
            );
            setAnalytics(createDefaultAnalytics(courseId));
          }
        } catch (analyticsError) {
          console.error("Failed to fetch analytics data:", analyticsError);
          setError("Could not load analytics data from backend");
          setAnalytics(createDefaultAnalytics(courseId));
        }

        // Fetch leaderboard data
        try {
          const leaderboardResponse = await axios.get(
            `/api/progress/analytics/course/${courseId}/leaderboard`
          );

          if (leaderboardResponse.data && leaderboardResponse.data.data) {
            console.log("Using real leaderboard data from backend");
            setLeaderboard(leaderboardResponse.data.data);
          } else {
            console.warn("Backend returned empty leaderboard");
            // Set empty leaderboard instead of placeholder data
            setLeaderboard([]);
          }
        } catch (leaderboardError) {
          console.error("Failed to fetch leaderboard data:", leaderboardError);
          // Set empty leaderboard instead of placeholder data
          setLeaderboard([]);
        }
      } catch (error) {
        console.error("Failed to fetch course progress:", error);
        setError("Could not load course progress data");
        setStudents([]);
        setFilteredStudents([]);
        setAnalytics(createDefaultAnalytics(courseId));
        // Set empty leaderboard
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseProgress();
  }, [courseId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(
        (student) =>
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleViewStudentDetails = (studentId: string) => {
    router.push(`/teacher/progress/student/${studentId}?courseId=${courseId}`);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "N/A";
    }
  };

  const sortByProgress = () => {
    const sorted = [...filteredStudents].sort(
      (a, b) => b.progress - a.progress
    );
    setFilteredStudents(sorted);
  };

  const sortByName = () => {
    const sorted = [...filteredStudents].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setFilteredStudents(sorted);
  };

  const StudentProgressTable = ({ students }: { students: Student[] }) => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Học sinh</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Chương</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Hoạt động cuối cùng</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={student.profileImage}
                        alt={student.name}
                      />
                      <AvatarFallback>
                        {student.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {student.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Progress value={student.progress} className="h-2 w-[80px]" />
                  <span className="text-xs text-muted-foreground ml-2">
                    {student.progress}%
                  </span>
                </TableCell>
                <TableCell>
                  {student.completedChapters}/{student.totalChapters}
                </TableCell>
                <TableCell>{student.totalTime || 0} hrs</TableCell>
                <TableCell>{formatDate(student.lastActivity)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewStudentDetails(student.id)}
                  >
                    <BarChart className="mr-2 h-4 w-4" />
                    Chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/teacher/progress")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Trở lại khoá học
        </Button>
        <h1 className="text-2xl font-bold">
          {course?.title} - Phân tích tiến độ
        </h1>
        {error && (
          <div className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded-md">
            {error}
            {analytics && (
              <span className="ml-1 text-amber-600">
                - Hiển thị dữ liệu mẫu cho xem trước
              </span>
            )}
          </div>
        )}
        <p className="text-muted-foreground">
          Thông tin chi tiết về sự tham gia và hiệu suất của học sinh
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="materials">Tài liệu và bài kiểm tra</TabsTrigger>
          <TabsTrigger value="students">Chi tiết học sinh</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Học sinh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics?.totalStudents || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Đã đăng ký khóa học này
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-blue-500" />
                  Lượt xem tài liệu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics?.materialAccessData.totalAccesses || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tổng lượt xem tài liệu
                </p>
                <div className="text-sm mt-2">
                  <span className="font-medium">
                    {analytics?.materialAccessData.averageAccessesPerStudent.toFixed(
                      1
                    ) || 0}
                  </span>{" "}
                  lượt xem tài liệu/học sinh
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-purple-500" />
                  Hoạt động thảo luận
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics?.discussionData.totalPosts || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tổng bài viết trong thảo luận
                </p>
                <div className="text-sm mt-2">
                  <span className="font-medium">
                    {analytics?.discussionData.averagePostsPerStudent.toFixed(
                      1
                    ) || 0}
                  </span>{" "}
                  bài viết/học sinh
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tiến độ khóa học</CardTitle>
                <CardDescription>
                  Tiến độ trung bình của tất cả học sinh
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tiến độ trung bình</span>
                        <span className="font-medium">
                          {Math.round(analytics?.averageProgress || 0)}%
                        </span>
                      </div>
                      <Progress
                        value={analytics?.averageProgress || 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Hiệu suất bài kiểm tra
                </CardTitle>
                <CardDescription>
                  Hoàn thành bài kiểm tra và điểm số của học sinh
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Điểm trung bình bài kiểm tra</span>
                        <span className="font-medium">
                          {Math.round(analytics?.quizData.averageScore || 0)}%
                        </span>
                      </div>
                      <Progress
                        value={analytics?.quizData.averageScore || 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tỷ lệ hoàn thành bài kiểm tra</span>
                        <span className="font-medium">
                          {Math.round(analytics?.quizData.completionRate || 0)}%
                        </span>
                      </div>
                      <Progress
                        value={analytics?.quizData.completionRate || 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2 flex items-center justify-center"
                    onClick={() =>
                      router.push(
                        `/teacher/progress/course/${courseId}/student-quizzes`
                      )
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Xem kết quả bài kiểm tra của học sinh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tham gia thảo luận</CardTitle>
              <CardDescription>
                Phân tích mức độ tham gia của học sinh
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4  rounded-xl">
                  <div className="text-xl font-bold text-green-600">
                    {analytics?.discussionData.participationLevels.high || 0}
                  </div>
                  <div className="text-sm text-center">High Participation</div>
                </div>
                <div className="flex flex-col items-center p-4  rounded-xl">
                  <div className="text-xl font-bold text-blue-600">
                    {analytics?.discussionData.participationLevels.medium || 0}
                  </div>
                  <div className="text-sm text-center">
                    Mức độ tham gia trung bình
                  </div>
                </div>
                <div className="flex flex-col items-center p-4  rounded-xl">
                  <div className="text-xl font-bold text-yellow-600">
                    {analytics?.discussionData.participationLevels.low || 0}
                  </div>
                  <div className="text-sm text-center">Tham gia thấp</div>
                </div>
                <div className="flex flex-col items-center p-4  rounded-xl">
                  <div className="text-xl font-bold text-gray-600">
                    {analytics?.discussionData.participationLevels.none || 0}
                  </div>
                  <div className="text-sm text-center">Không tham gia</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Leaderboard Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                Bảng xếp hạng hàng tháng
              </CardTitle>
              <CardDescription>
                Top 3 học sinh có điểm bài kiểm tra cao nhất tháng này
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="flex flex-col md:flex-row justify-center items-center gap-6 py-4">
                  {/* Second Place - Only show if we have at least 2 entries */}
                  {leaderboard.length >= 2 && (
                    <div className="flex flex-col items-center order-2 md:order-1">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-silver">
                          {leaderboard[1].avatarUrl ? (
                            <AvatarImage
                              src={leaderboard[1].avatarUrl}
                              alt={leaderboard[1].name}
                            />
                          ) : (
                            <AvatarFallback className="bg-silver-100 text-silver-700">
                              {leaderboard[1].name
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-silver-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="font-medium">{leaderboard[1].name}</p>
                        <p className="text-sm text-muted-foreground">
                          {leaderboard[1].score}% điểm trung bình
                        </p>
                      </div>
                    </div>
                  )}

                  {/* First Place */}
                  <div className="flex flex-col items-center order-1 md:order-2 scale-110">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-2 border-yellow-500">
                        {leaderboard[0].avatarUrl ? (
                          <AvatarImage
                            src={leaderboard[0].avatarUrl}
                            alt={leaderboard[0].name}
                          />
                        ) : (
                          <AvatarFallback className="bg-yellow-100 text-yellow-700">
                            {leaderboard[0].name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="font-medium">{leaderboard[0].name}</p>
                      <p className="text-sm text-muted-foreground">
                        {leaderboard[0].score}% điểm trung bình
                      </p>
                    </div>
                  </div>

                  {/* Third Place - Only show if we have at least 3 entries */}
                  {leaderboard.length >= 3 && (
                    <div className="flex flex-col items-center order-3">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-bronze">
                          {leaderboard[2].avatarUrl ? (
                            <AvatarImage
                              src={leaderboard[2].avatarUrl}
                              alt={leaderboard[2].name}
                            />
                          ) : (
                            <AvatarFallback className="bg-bronze-100 text-bronze-700">
                              {leaderboard[2].name
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-bronze-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="font-medium">{leaderboard[2].name}</p>
                        <p className="text-sm text-muted-foreground">
                          {leaderboard[2].score}% điểm trung bình
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Chưa có dữ liệu bảng xếp hạng cho tháng này</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() =>
                  router.push(
                    `/teacher/progress/course/${courseId}/leaderboard`
                  )
                }
              >
                Xem bảng xếp hạng đầy đủ
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lượt xem tài liệu</CardTitle>
                <CardDescription>Thống kê sử dụng tài liệu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className=" p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-medium">
                        Tổng lượt xem tài liệu
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics?.materialAccessData.totalAccesses || 0}
                    </div>
                  </div>

                  <div className=" p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <User className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="font-medium">
                        Lượt xem tài liệu trung bình/học sinh
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics?.materialAccessData.averageAccessesPerStudent.toFixed(
                        1
                      ) || 0}
                    </div>
                  </div>

                  <div className=" p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium">
                        Học sinh không truy cập tài liệu
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics?.materialAccessData.studentsWithNoAccess || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Hiệu suất bài kiểm tra
                </CardTitle>
                <CardDescription>
                  Chi tiết về hoàn thành và hiệu suất bài kiểm tra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className=" p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FileText className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-medium">
                        Điểm trung bình bài kiểm tra
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.round(analytics?.quizData.averageScore || 0)}%
                    </div>
                  </div>

                  <div className=" p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="font-medium">
                        Tỷ lệ hoàn thành bài kiểm tra
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.round(analytics?.quizData.completionRate || 0)}%
                    </div>
                  </div>

                  <div className=" p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <User className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium">
                        Học sinh không làm bài kiểm tra
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics?.quizData.studentsWithNoQuizzes || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hiệu suất học sinh</CardTitle>
              <CardDescription>
                Chi tiết về tiến độ và tham gia của từng học sinh
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học sinh</TableHead>
                      <TableHead>Tiến độ</TableHead>
                      <TableHead>Lượt xem tài liệu</TableHead>
                      <TableHead>Điểm trung bình bài kiểm tra</TableHead>
                      <TableHead>Tham gia</TableHead>
                      <TableHead>Lần truy cập cuối</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics?.studentDetails.map((student) => (
                      <TableRow key={student.userId}>
                        <TableCell className="font-medium">
                          {student.userId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={student.progress}
                              className="h-2 w-20"
                            />
                            <span className="text-sm">
                              {Math.round(student.progress)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{student.materialAccesses}</TableCell>
                        <TableCell>
                          {Math.round(student.quizAverage)}%
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              student.participationLevel === "High"
                                ? "bg-green-100 text-green-700"
                                : student.participationLevel === "Medium"
                                ? "bg-blue-100 text-blue-700"
                                : student.participationLevel === "Low"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {student.participationLevel}
                          </span>
                        </TableCell>
                        <TableCell>
                          {student.lastAccessed
                            ? formatDate(student.lastAccessed)
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleViewStudentDetails(student.userId)
                            }
                          >
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseProgressPage;
