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
  getPlaceholderAnalytics,
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
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseProgress = async () => {
      try {
        setLoading(true);

        // Fetch course details
        try {
          const courseResponse = await axios.get(
            `/api/teacher/courses/${courseId}`
          );
          setCourse(courseResponse.data);
        } catch (courseError) {
          console.warn("Could not fetch course details, using generic title");
          setCourse({ id: courseId, title: "Course Details" });
        }

        // Fetch all students and their progress for this course
        const studentsResponse = await axios.get(
          `/api/courses/${courseId}/progress`
        );
        setStudents(studentsResponse.data);
        setFilteredStudents(studentsResponse.data);

        // Fetch analytics data
        try {
          const analyticsData = await fetchCourseProgressAnalytics(courseId);
          setAnalytics(analyticsData);
        } catch (analyticsError) {
          console.warn("Using placeholder analytics data - API not available");
          setAnalytics(getPlaceholderAnalytics(courseId));
        }
      } catch (error) {
        console.error("Failed to fetch course progress:", error);
        setError("Could not load course progress data");
        // Still use placeholder data to show the UI
        setAnalytics(getPlaceholderAnalytics(courseId));
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
              <TableHead className="w-[80px]">Student</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Chapters</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    Details
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
          Back to All Courses
        </Button>
        <h1 className="text-2xl font-bold">
          {course?.title} - Progress Analytics
        </h1>
        {error && (
          <div className="mt-2 text-sm text-amber-600">
            {error} - Showing demo data for preview
          </div>
        )}
        <p className="text-muted-foreground">
          Detailed insights on student engagement and performance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="materials">Materials & Quizzes</TabsTrigger>
          <TabsTrigger value="students">Student Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics?.totalStudents || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Enrolled in this course
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-blue-500" />
                  Material Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics?.materialAccessData.totalAccesses || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total material views
                </p>
                <div className="text-sm mt-2">
                  <span className="font-medium">
                    {analytics?.materialAccessData.averageAccessesPerStudent.toFixed(
                      1
                    ) || 0}
                  </span>{" "}
                  views per student
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-purple-500" />
                  Discussion Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics?.discussionData.totalPosts || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total discussion posts
                </p>
                <div className="text-sm mt-2">
                  <span className="font-medium">
                    {analytics?.discussionData.averagePostsPerStudent.toFixed(
                      1
                    ) || 0}
                  </span>{" "}
                  posts per student
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Progress</CardTitle>
                <CardDescription>
                  Average completion progress across all students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Progress</span>
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
                <CardTitle className="text-lg">Quiz Performance</CardTitle>
                <CardDescription>
                  Student quiz completion and scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Quiz Score</span>
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
                        <span>Quiz Completion Rate</span>
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
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Discussion Participation
              </CardTitle>
              <CardDescription>
                Breakdown of student participation levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-xl font-bold text-green-600">
                    {analytics?.discussionData.participationLevels.high || 0}
                  </div>
                  <div className="text-sm text-center">High Participation</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-xl font-bold text-blue-600">
                    {analytics?.discussionData.participationLevels.medium || 0}
                  </div>
                  <div className="text-sm text-center">
                    Medium Participation
                  </div>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-xl font-bold text-yellow-600">
                    {analytics?.discussionData.participationLevels.low || 0}
                  </div>
                  <div className="text-sm text-center">Low Participation</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-xl font-bold text-gray-600">
                    {analytics?.discussionData.participationLevels.none || 0}
                  </div>
                  <div className="text-sm text-center">No Participation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Course Materials Access
                </CardTitle>
                <CardDescription>
                  Course material usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-medium">Total Material Views</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics?.materialAccessData.totalAccesses || 0}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <User className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="font-medium">Avg Views Per Student</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {analytics?.materialAccessData.averageAccessesPerStudent.toFixed(
                        1
                      ) || 0}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium">
                        Students With No Access
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
                <CardTitle className="text-lg">Quiz Performance</CardTitle>
                <CardDescription>
                  Detailed quiz completion and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FileText className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-medium">Average Quiz Score</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.round(analytics?.quizData.averageScore || 0)}%
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="font-medium">Quiz Completion Rate</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.round(analytics?.quizData.completionRate || 0)}%
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <User className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium">
                        Students Without Quizzes
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
              <CardTitle className="text-lg">Student Performance</CardTitle>
              <CardDescription>
                Detailed breakdown of individual student progress and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Material Views</TableHead>
                      <TableHead>Quiz Avg</TableHead>
                      <TableHead>Participation</TableHead>
                      <TableHead>Last Accessed</TableHead>
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
                            Details
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
