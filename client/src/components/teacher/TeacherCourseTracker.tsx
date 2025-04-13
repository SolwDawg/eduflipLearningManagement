import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoadingAlternative from "@/components/LoadingAlternative";
import { formatDateString, formatDuration } from "@/lib/utils";
import {
  Search,
  Clock,
  ChevronRight,
  BarChart3,
  Users,
  BookOpen,
  FileQuestion,
  Eye,
  ChevronDown,
  Filter,
} from "lucide-react";
import {
  useGetAllTeacherCoursesWithAnalyticsQuery,
  useGetCourseQuizResultsQuery,
  useGetCourseQuery,
  useGetEnrolledStudentsWithProgressQuery,
  useGetQuizzesQuery,
} from "@/state/api";

// Interfaces
interface StudentProgress {
  userId: string;
  fullName: string;
  email: string;
  enrollmentDate: string;
  overallProgress: number;
  lastAccessedTimestamp: string;
  completedChapters: number;
  totalChapters: number;
  quizResults: QuizResult[];
  averageQuizScore: number;
}

interface QuizResult {
  quizId: string;
  score: number;
  maxScore: number;
  submittedAt: string;
  timeSpent?: number;
}

interface Quiz {
  quizId: string;
  title: string;
  description?: string;
  scope: string;
  courseId: string;
  questions: any[];
}

// Component for course list
const CoursesList = () => {
  const router = useRouter();
  const { data: coursesWithAnalytics, isLoading } =
    useGetAllTeacherCoursesWithAnalyticsQuery();
  const [searchTerm, setSearchTerm] = useState("");

  // Prepare courses with analytics data
  const courses = useMemo(() => {
    if (!coursesWithAnalytics) return [];

    return coursesWithAnalytics.map((course: any) => ({
      id: course.courseId || course.id,
      title: course.title,
      studentCount: course.studentCount || 0,
      averageProgress: course.averageProgress || 0,
      completionRate: course.completionRate || 0,
      materialAccessCount: course.materialAccessCount || 0,
      quizAverage: course.quizAverage || 0,
      discussionPostCount: course.discussionPostCount || 0,
    }));
  }, [coursesWithAnalytics]);

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;

    return courses.filter((course: any) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  const handleViewCourse = (courseId: string) => {
    router.push(`/teacher/progress/course/${courseId}`);
  };

  if (isLoading) {
    return <LoadingAlternative />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm khoá học..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course: any) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between">
                  {course.title}
                  <Badge variant="outline">
                    {course.studentCount} học sinh
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Tiến độ trung bình: {Math.round(course.averageProgress)}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tỷ lệ hoàn thành bài kiểm tra</span>
                      <span className="font-medium">
                        {Math.round(course.completionRate)}%
                      </span>
                    </div>
                    <Progress value={course.completionRate} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Điểm trung bình bài kiểm tra</span>
                      <span className="font-medium">
                        {Math.round(course.quizAverage)}%
                      </span>
                    </div>
                    <Progress value={course.quizAverage} className="h-2" />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-2 text-sm text-muted-foreground">
                      <FileQuestion className="h-4 w-4" />
                      <span>Thống kê bài kiểm tra</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCourse(course.id)}
                      className="flex items-center space-x-1"
                    >
                      <span>Xem</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex justify-center p-8 text-muted-foreground">
            Không tìm thấy khoá học.
          </div>
        )}
      </div>
    </div>
  );
};

// Component for course details with students and quizzes
const CourseDetails = ({ courseId }: { courseId: string }) => {
  const [activeTab, setActiveTab] = useState("students");
  const { data: course, isLoading: isLoadingCourse } =
    useGetCourseQuery(courseId);
  const { data: enrolledStudents, isLoading: isLoadingStudents } =
    useGetEnrolledStudentsWithProgressQuery(courseId);
  const { data: quizzes, isLoading: isLoadingQuizzes } = useGetQuizzesQuery({
    courseId,
  });
  const { data: quizResults, isLoading: isLoadingQuizResults } =
    useGetCourseQuizResultsQuery(courseId);

  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [quizSearchTerm, setQuizSearchTerm] = useState("");

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!enrolledStudents || !enrolledStudents.length) return [];
    if (!studentSearchTerm.trim()) return enrolledStudents;

    return enrolledStudents.filter(
      (student: StudentProgress) =>
        student.fullName
          .toLowerCase()
          .includes(studentSearchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
    );
  }, [enrolledStudents, studentSearchTerm]);

  // Filter quizzes based on search term
  const filteredQuizzes = useMemo(() => {
    if (!quizzes || !quizzes.length) return [];
    if (!quizSearchTerm.trim()) return quizzes;

    return quizzes.filter(
      (quiz: Quiz) =>
        quiz.title.toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
        (quiz.description &&
          quiz.description.toLowerCase().includes(quizSearchTerm.toLowerCase()))
    );
  }, [quizzes, quizSearchTerm]);

  if (
    isLoadingCourse ||
    isLoadingStudents ||
    isLoadingQuizzes ||
    isLoadingQuizResults
  ) {
    return <LoadingAlternative />;
  }

  if (!course) {
    return <div className="text-center p-8">Không tìm thấy khoá học.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{course.title}</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Học sinh đã đăng ký
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <FileQuestion className="h-4 w-4 mr-2" />
            Bài kiểm tra
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Phân tích hiệu suất
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="pt-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm học sinh..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Học sinh đã đăng ký ({filteredStudents.length})
                </CardTitle>
                <CardDescription>
                  Xem tiến độ và hiệu suất bài kiểm tra cho tất cả học sinh
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học sinh</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead>Tiến độ</TableHead>
                      <TableHead>Chương đã hoàn thành</TableHead>
                      <TableHead>Điểm bài kiểm tra</TableHead>
                      <TableHead>Hoạt động cuối cùng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student: StudentProgress) => (
                        <TableRow key={student.userId}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{student.fullName}</span>
                              <span className="text-muted-foreground text-xs">
                                {student.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDateString(student.enrollmentDate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress
                                value={student.overallProgress}
                                className="h-2 w-20"
                              />
                              <span className="text-sm">
                                {Math.round(student.overallProgress)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.completedChapters} /{" "}
                            {student.totalChapters}
                          </TableCell>
                          <TableCell>
                            {student.averageQuizScore !== undefined
                              ? `${Math.round(student.averageQuizScore)}%`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatDateString(student.lastAccessedTimestamp)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Không tìm thấy học sinh.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="pt-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={quizSearchTerm}
                onChange={(e) => setQuizSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {filteredQuizzes.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredQuizzes.map((quiz: Quiz) => {
                  // Get results for this quiz
                  const quizResultsList =
                    quizResults?.byQuiz?.[quiz.quizId] || [];
                  const completionCount = quizResultsList.length;
                  const averageScore =
                    quizResultsList.length > 0
                      ? Math.round(
                          quizResultsList.reduce(
                            (sum: number, result: any) =>
                              sum + (result.score / result.maxScore) * 100,
                            0
                          ) / quizResultsList.length
                        )
                      : 0;

                  return (
                    <Card key={quiz.quizId}>
                      <AccordionItem
                        value={quiz.quizId}
                        className="border-none"
                      >
                        <CardHeader className="pb-2">
                          <AccordionTrigger className="py-0">
                            <div className="flex flex-col items-start">
                              <CardTitle className="text-lg">
                                {quiz.title}
                              </CardTitle>
                              <CardDescription>
                                {quiz.description || "No description provided"}
                              </CardDescription>
                            </div>
                          </AccordionTrigger>
                        </CardHeader>
                        <AccordionContent>
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <Card className="bg-muted/40">
                                  <CardContent className="p-4">
                                    <div className="flex flex-col items-center space-y-2">
                                      <Users className="h-8 w-8 text-primary mb-2" />
                                      <span className="text-2xl font-bold">
                                        {completionCount}
                                      </span>
                                      <span className="text-muted-foreground text-sm">
                                        {completionCount === 1
                                          ? "Học sinh"
                                          : "Học sinh"}{" "}
                                        đã hoàn thành
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="bg-muted/40">
                                  <CardContent className="p-4">
                                    <div className="flex flex-col items-center space-y-2">
                                      <BarChart3 className="h-8 w-8 text-primary mb-2" />
                                      <span className="text-2xl font-bold">
                                        {averageScore}%
                                      </span>
                                      <span className="text-muted-foreground text-sm">
                                        Điểm trung bình
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="bg-muted/40">
                                  <CardContent className="p-4">
                                    <div className="flex flex-col items-center space-y-2">
                                      <Clock className="h-8 w-8 text-primary mb-2" />
                                      <span className="text-2xl font-bold">
                                        {quizResultsList.length > 0
                                          ? Math.round(
                                              quizResultsList.reduce(
                                                (sum: number, result: any) =>
                                                  sum + (result.timeSpent || 0),
                                                0
                                              ) /
                                                quizResultsList.length /
                                                60
                                            )
                                          : 0}
                                        m
                                      </span>
                                      <span className="text-muted-foreground text-sm">
                                        Thời gian trung bình
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg">
                                    Kết quả học sinh
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Học sinh</TableHead>
                                        <TableHead>Điểm</TableHead>
                                        <TableHead>Thời gian</TableHead>
                                        <TableHead>Ngày hoàn thành</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {quizResultsList.length > 0 ? (
                                        quizResultsList.map((result: any) => {
                                          // Find student info based on userId
                                          const student =
                                            enrolledStudents?.find(
                                              (s: StudentProgress) =>
                                                s.userId === result.userId
                                            );

                                          return (
                                            <TableRow
                                              key={`${result.quizId}-${result.userId}`}
                                            >
                                              <TableCell className="font-medium">
                                                {student?.fullName ||
                                                  result.userId}
                                              </TableCell>
                                              <TableCell>
                                                {Math.round(
                                                  (result.score /
                                                    result.maxScore) *
                                                    100
                                                )}
                                                %
                                              </TableCell>
                                              <TableCell>
                                                {result.timeSpent
                                                  ? `${Math.floor(
                                                      result.timeSpent / 60
                                                    )}m ${
                                                      result.timeSpent % 60
                                                    }s`
                                                  : "N/A"}
                                              </TableCell>
                                              <TableCell>
                                                {formatDateString(
                                                  result.submittedAt
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })
                                      ) : (
                                        <TableRow>
                                          <TableCell
                                            colSpan={4}
                                            className="text-center"
                                          >
                                            Không có học sinh nào hoàn thành bài
                                            kiểm tra này.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </AccordionContent>
                      </AccordionItem>
                    </Card>
                  );
                })}
              </Accordion>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Không tìm thấy bài kiểm tra cho khoá học này.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Tỷ lệ hoàn thành bài kiểm tra
                </CardTitle>
                <CardDescription>
                  Phần trăm học sinh đã hoàn thành mỗi bài kiểm tra
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredQuizzes.length > 0 ? (
                  <div className="space-y-4">
                    {filteredQuizzes.map((quiz: Quiz) => {
                      const totalStudents = enrolledStudents?.length || 0;
                      const completionCount = (
                        quizResults?.byQuiz?.[quiz.quizId] || []
                      ).length;
                      const completionRate =
                        totalStudents > 0
                          ? (completionCount / totalStudents) * 100
                          : 0;

                      return (
                        <div key={quiz.quizId} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[200px]">
                              {quiz.title}
                            </span>
                            <span className="font-medium">
                              {Math.round(completionRate)}%
                            </span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {completionCount} của {totalStudents} học sinh
                            đã hoàn thành
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Không có bài kiểm tra nào cho khoá học này.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Điểm trung bình bài kiểm tra
                </CardTitle>
                <CardDescription>
                  Điểm trung bình cho mỗi bài kiểm tra trong khoá học này
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredQuizzes.length > 0 ? (
                  <div className="space-y-4">
                    {filteredQuizzes.map((quiz: Quiz) => {
                      const quizResultsList =
                        quizResults?.byQuiz?.[quiz.quizId] || [];
                      const averageScore =
                        quizResultsList.length > 0
                          ? Math.round(
                              quizResultsList.reduce(
                                (sum: number, result: any) =>
                                  sum + (result.score / result.maxScore) * 100,
                                0
                              ) / quizResultsList.length
                            )
                          : 0;

                      return (
                        <div key={quiz.quizId} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[200px]">
                              {quiz.title}
                            </span>
                            <span className="font-medium">{averageScore}%</span>
                          </div>
                          <Progress value={averageScore} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            Dựa trên {quizResultsList.length}{" "}
                            {quizResultsList.length === 1
                              ? "bài kiểm tra"
                              : "bài kiểm tra"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Không có bài kiểm tra nào cho khoá học này.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Main component
const TeacherCourseTracker = ({ courseId }: { courseId?: string }) => {
  return (
    <div className="space-y-8">
      {courseId ? <CourseDetails courseId={courseId} /> : <CoursesList />}
    </div>
  );
};

export default TeacherCourseTracker;
