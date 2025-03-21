"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BarChart,
  MessageSquare,
  Users,
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Eye,
  ThumbsUp,
} from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StudentDetail {
  userId: string;
  name: string;
  email: string;
  profileImage: string;
  enrollmentDate: string;
  lastAccessDate: string;
  overallProgress: number;
  sections: {
    sectionId: string;
    title: string;
    progress: number;
    chapters: {
      chapterId: string;
      title: string;
      completed: boolean;
      accessCount: number;
      lastAccessDate: string;
    }[];
  }[];
  totalMaterialAccessCount: number;
  quizResults: {
    quizId: string;
    title: string;
    score: number;
    totalQuestions: number;
    attemptDate: string;
  }[];
  averageQuizScore: number;
  discussionActivity: {
    discussionId: string;
    title: string;
    postsCount: number;
    lastActivityDate: string;
  }[];
  participationLevel: string;
}

interface Course {
  id: string;
  title: string;
}

const StudentProgressPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = params.studentId as string;
  const courseId = searchParams.get("courseId");
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchStudentProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course details if courseId is provided
        if (courseId) {
          try {
            const courseResponse = await axios.get(
              `/api/teacher/courses/${courseId}`
            );
            setCourse(courseResponse.data);
          } catch (courseError) {
            console.warn("Could not fetch course details");
            setCourse({ id: courseId, title: "Course Details" });
          }
        }

        // Fetch student progress details
        const progressResponse = await axios.get(
          `/api/progress/analytics/course/${courseId}/student/${studentId}`
        );

        if (progressResponse.data && progressResponse.data.data) {
          setStudent(progressResponse.data.data);
        } else {
          setError("No student progress data found");
        }
      } catch (error) {
        console.error("Failed to fetch student progress:", error);
        setError("Could not load student progress data");
      } finally {
        setLoading(false);
      }
    };

    if (studentId && courseId) {
      fetchStudentProgress();
    } else {
      setError("Missing student ID or course ID");
      setLoading(false);
    }
  }, [studentId, courseId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "N/A";
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      return "N/A";
    }
  };

  const handleBackToCourse = () => {
    router.push(`/teacher/progress/course/${courseId}`);
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

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <Button className="mt-4" onClick={handleBackToCourse}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBackToCourse}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {course?.title || "Course"}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage
                  src={student?.profileImage}
                  alt={student?.name || "Student"}
                />
                <AvatarFallback>
                  {student?.name
                    ? student.name.substring(0, 2).toUpperCase()
                    : "ST"}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{student?.name}</h3>
              <p className="text-sm text-muted-foreground">{student?.email}</p>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  Enrolled
                </h4>
                <p className="text-sm pl-6">
                  {formatDate(student?.enrollmentDate)}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  Last Activity
                </h4>
                <p className="text-sm pl-6">
                  {formatDateTime(student?.lastAccessDate)}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  Participation Level
                </h4>
                <p className="text-sm pl-6">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student?.participationLevel === "High"
                        ? "bg-green-100 text-green-700"
                        : student?.participationLevel === "Medium"
                        ? "bg-blue-100 text-blue-700"
                        : student?.participationLevel === "Low"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {student?.participationLevel || "None"}
                  </span>
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                  Material Views
                </h4>
                <p className="text-sm pl-6">
                  {student?.totalMaterialAccessCount || 0} views
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                  Average Quiz Score
                </h4>
                <p className="text-sm pl-6">
                  {student?.averageQuizScore
                    ? `${Math.round(student.averageQuizScore)}%`
                    : "No quizzes taken"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle className="text-lg">Course Progress</CardTitle>
            <CardDescription>
              Overall progress: {Math.round(student?.overallProgress || 0)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={student?.overallProgress || 0}
              className="h-2 mb-6"
            />

            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="pt-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          <BookOpen className="mr-2 h-4 w-4 text-primary" />
                          Materials
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {student?.totalMaterialAccessCount || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total views
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-blue-500" />
                          Quizzes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {student?.quizResults?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Attempts
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          <MessageSquare className="mr-2 h-4 w-4 text-green-500" />
                          Discussions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {student?.discussionActivity?.reduce(
                            (total, discussion) =>
                              total + (discussion.postsCount || 0),
                            0
                          ) || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total posts
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Section Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {student?.sections?.map((section) => (
                          <div key={section.sectionId} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                {section.title}
                              </span>
                              <span>{Math.round(section.progress)}%</span>
                            </div>
                            <Progress
                              value={section.progress}
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="materials" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Material Access</CardTitle>
                    <CardDescription>
                      Phân tích chi tiết về truy cập tài liệu của sinh viên
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {student?.sections?.length ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Chapter</TableHead>
                              <TableHead>Views</TableHead>
                              <TableHead>Last Accessed</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {student.sections.flatMap((section) =>
                              section.chapters.map((chapter) => (
                                <TableRow key={chapter.chapterId}>
                                  <TableCell className="font-medium">
                                    {chapter.title}
                                  </TableCell>
                                  <TableCell>{chapter.accessCount}</TableCell>
                                  <TableCell>
                                    {formatDate(chapter.lastAccessDate)}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        chapter.completed
                                          ? "bg-green-100 text-green-700"
                                          : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {chapter.completed
                                        ? "Completed"
                                        : "In Progress"}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No material access data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quizzes" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Kết quả thi</CardTitle>
                    <CardDescription>
                      Kết quả thi của sinh viên trong khóa học
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {student?.quizResults?.length ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Quiz</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Date Taken</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {student.quizResults.map((quiz) => (
                              <TableRow key={quiz.quizId}>
                                <TableCell className="font-medium">
                                  {quiz.title}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress
                                      value={
                                        (quiz.score / quiz.totalQuestions) * 100
                                      }
                                      className="h-2 w-20"
                                    />
                                    <span className="text-sm">
                                      {Math.round(
                                        (quiz.score / quiz.totalQuestions) * 100
                                      )}
                                      %
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatDate(quiz.attemptDate)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No quiz results available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            Discussion Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student?.discussionActivity?.length ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Discussion Topic</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.discussionActivity.map((discussion) => (
                    <TableRow key={discussion.discussionId}>
                      <TableCell className="font-medium">
                        {discussion.title}
                      </TableCell>
                      <TableCell>{discussion.postsCount}</TableCell>
                      <TableCell>
                        {formatDate(discussion.lastActivityDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No discussion activity available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProgressPage;
