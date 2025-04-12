"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Search,
  Clock,
  Award,
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

// Types for student data
interface Test {
  courseId: string;
  courseTitle: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  completionDate: string;
  attemptCount: number;
  timeSpent: number | string;
}

interface Course {
  courseId: string;
  courseTitle: string;
  enrollmentDate: string;
  progress: number;
  completedChapters: number;
  totalChapters: number;
  lastAccessed: string;
}

interface StudentData {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  courses: Course[];
  tests: Test[];
  totalCourses: number;
  averageProgress: number;
  lastActivity: string;
}

const StudentLearningProgress = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const fetchDetailedStudentProgress = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/progress/teacher/students/detailed-progress`
      );

      // Sort students by name
      const sortedStudents = response.data.data.sort(
        (a: StudentData, b: StudentData) => a.fullName.localeCompare(b.fullName)
      );

      setStudents(sortedStudents);
    } catch (error) {
      console.error("Failed to fetch detailed student progress:", error);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetailedStudentProgress();
  }, []);

  const handleRefresh = () => {
    fetchDetailedStudentProgress(true);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "Not available";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  };

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStudentExpansion = (studentId: string) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(studentId);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 50) return "text-red-500";
    if (score < 70) return "text-yellow-500";
    return "text-green-500";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Student Learning Progress
        </h2>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No student data found. Please try refreshing or check back later.
            </p>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No students match your search criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredStudents.map((student) => (
            <Card key={student.userId} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-6 cursor-pointer bg-muted/30"
                onClick={() => toggleStudentExpansion(student.userId)}
              >
                <div className="flex items-center gap-4">
                  {student.avatarUrl ? (
                    <img
                      src={student.avatarUrl}
                      alt={student.fullName}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">
                      {student.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Courses</div>
                    <div className="font-medium">{student.totalCourses}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Avg. Progress
                    </div>
                    <div className="font-medium">
                      {Math.round(student.averageProgress)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Last Activity
                    </div>
                    <div className="font-medium">
                      {student.lastActivity
                        ? new Date(student.lastActivity).toLocaleDateString()
                        : "Never"}
                    </div>
                  </div>
                  {expandedStudent === student.userId ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedStudent === student.userId && (
                <CardContent className="p-6 bg-background">
                  <Tabs defaultValue="courses">
                    <TabsList className="mb-4">
                      <TabsTrigger value="courses">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Courses Progress
                      </TabsTrigger>
                      <TabsTrigger value="tests">
                        <Award className="h-4 w-4 mr-2" />
                        Test Results
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="courses" className="mt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Enrollment Date</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Completed</TableHead>
                            <TableHead>Last Accessed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {student.courses.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground"
                              >
                                No courses enrolled
                              </TableCell>
                            </TableRow>
                          ) : (
                            student.courses.map((course) => (
                              <TableRow key={course.courseId}>
                                <TableCell className="font-medium">
                                  {course.courseTitle}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    course.enrollmentDate
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress
                                      value={course.progress}
                                      className="h-2 w-32"
                                    />
                                    <span>{Math.round(course.progress)}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {course.completedChapters} /{" "}
                                  {course.totalChapters} chapters
                                </TableCell>
                                <TableCell>
                                  {course.lastAccessed
                                    ? new Date(
                                        course.lastAccessed
                                      ).toLocaleDateString()
                                    : "Never"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="tests" className="mt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Time Spent</TableHead>
                            <TableHead>Attempts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {student.tests.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground"
                              >
                                No tests taken
                              </TableCell>
                            </TableRow>
                          ) : (
                            student.tests.map((test, index) => (
                              <TableRow key={`${test.quizId}-${index}`}>
                                <TableCell className="font-medium">
                                  {test.courseTitle}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    test.completionDate
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell
                                  className={getScoreColor(test.score)}
                                >
                                  {test.score}%
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {typeof test.timeSpent === "number"
                                      ? formatTime(test.timeSpent)
                                      : test.timeSpent}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {test.attemptCount}{" "}
                                    {test.attemptCount === 1
                                      ? "attempt"
                                      : "attempts"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentLearningProgress;
