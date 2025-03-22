"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  getCourseQuizResults,
  StudentQuizResult,
} from "@/lib/studentProgressApi";
import { useGetQuizzesQuery } from "@/state/api";
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface CourseQuizResultsProps {
  courseId: string;
}

export default function CourseQuizResults({
  courseId,
}: CourseQuizResultsProps) {
  const [quizResults, setQuizResults] = useState<{
    allResults: StudentQuizResult[];
    byQuiz: { [key: string]: StudentQuizResult[] };
  }>({ allResults: [], byQuiz: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const { data: quizzes, isLoading: quizzesLoading } = useGetQuizzesQuery({
    courseId,
  });

  useEffect(() => {
    const fetchQuizResults = async () => {
      try {
        setLoading(true);
        const results = await getCourseQuizResults(courseId);
        setQuizResults(results);

        // Fetch student names (this would be replaced with your actual API)
        const nameMap: Record<string, string> = {};
        const uniqueUserIds = [
          ...new Set(results.allResults.map((r) => r.userId)),
        ];

        for (const userId of uniqueUserIds) {
          try {
            // This is a placeholder - replace with your actual user info API
            const response = await fetch(`/api/users/${userId}`);
            const data = await response.json();
            nameMap[userId] = data.name || `Student ${userId.substring(0, 8)}`;
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            nameMap[userId] = `Student ${userId.substring(0, 8)}`;
          }
        }

        setStudentNames(nameMap);
      } catch (err) {
        console.error("Error loading quiz results:", err);
        setError("Failed to load quiz results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, [courseId]);

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (error) {
      return "Unknown date";
    }
  };

  if (loading || quizzesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const quizMap =
    quizzes?.reduce((map: Record<string, any>, quiz: any) => {
      map[quiz.id] = quiz;
      return map;
    }, {}) || {};

  // Get quiz IDs in order
  const quizIds = Object.keys(quizResults.byQuiz);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Tổng quan kết quả bài kiểm tra
          </CardTitle>
          <CardDescription>
            Xem tất cả kết quả bài kiểm tra của học sinh trong khóa học này
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quizResults.allResults.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">
                Không có kết quả bài kiểm tra cho khóa học này.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="by-quiz">
              <TabsList className="mb-4">
                <TabsTrigger value="by-quiz">Theo bài kiểm tra</TabsTrigger>
                <TabsTrigger value="by-student">Theo học sinh</TabsTrigger>
              </TabsList>

              <TabsContent value="by-quiz">
                <Accordion type="single" collapsible>
                  {quizIds.map((quizId) => {
                    const quizStudentResults = quizResults.byQuiz[quizId];
                    const quizInfo = quizMap[quizId] || {
                      title: `Bài kiểm tra ${quizId.substring(0, 8)}`,
                    };
                    const totalAttempts = quizStudentResults.length;
                    const avgScore =
                      quizStudentResults.reduce(
                        (sum, result) => sum + result.score,
                        0
                      ) / totalAttempts;
                    const avgPercentage =
                      quizStudentResults.reduce(
                        (sum, result) =>
                          sum + (result.score / result.totalQuestions) * 100,
                        0
                      ) / totalAttempts;

                    return (
                      <AccordionItem key={quizId} value={quizId}>
                        <AccordionTrigger>
                          <div className="flex justify-between w-full pr-4">
                            <span>{quizInfo.title}</span>
                            <div className="flex items-center space-x-4">
                              <Badge
                                variant="outline"
                                className="flex items-center"
                              >
                                <Users className="h-3 w-3 mr-1" />
                                <span>{totalAttempts} lần làm bài</span>
                              </Badge>
                              <Badge
                                className={`${
                                  avgPercentage >= 80
                                    ? "bg-green-100 text-green-800"
                                    : avgPercentage >= 60
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {Math.round(avgPercentage)}% trung bình
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Học sinh</TableHead>
                                <TableHead>Điểm</TableHead>
                                <TableHead>Tỷ lệ</TableHead>
                                <TableHead>Ngày hoàn thành</TableHead>
                                <TableHead>Lần làm bài</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {quizStudentResults.map((result, idx) => {
                                const percentage =
                                  (result.score / result.totalQuestions) * 100;
                                return (
                                  <TableRow key={`${result.userId}-${idx}`}>
                                    <TableCell className="font-medium">
                                      {studentNames[result.userId] ||
                                        `Student ${result.userId.substring(
                                          0,
                                          8
                                        )}`}
                                    </TableCell>
                                    <TableCell
                                      className={getScoreColor(
                                        result.score,
                                        result.totalQuestions
                                      )}
                                    >
                                      {result.score}/{result.totalQuestions}
                                    </TableCell>
                                    <TableCell>
                                      {percentage >= 80 ? (
                                        <span className="flex items-center text-green-600">
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          {Math.round(percentage)}%
                                        </span>
                                      ) : percentage >= 60 ? (
                                        <span className="flex items-center text-amber-600">
                                          <AlertTriangle className="h-4 w-4 mr-1" />
                                          {Math.round(percentage)}%
                                        </span>
                                      ) : (
                                        <span className="flex items-center text-red-600">
                                          <XCircle className="h-4 w-4 mr-1" />
                                          {Math.round(percentage)}%
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(result.completionDate)}
                                    </TableCell>
                                    <TableCell>{result.attemptCount}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </TabsContent>

              <TabsContent value="by-student">
                {/* Group results by student */}
                {(() => {
                  const studentMap: Record<string, StudentQuizResult[]> = {};

                  quizResults.allResults.forEach((result) => {
                    if (!studentMap[result.userId]) {
                      studentMap[result.userId] = [];
                    }
                    studentMap[result.userId].push(result);
                  });

                  return (
                    <Accordion type="single" collapsible>
                      {Object.keys(studentMap).map((userId) => {
                        const studentResults = studentMap[userId];
                        const studentName =
                          studentNames[userId] ||
                          `Student ${userId.substring(0, 8)}`;
                        const completedQuizzes = studentResults.length;
                        const avgScore =
                          studentResults.reduce(
                            (sum, result) =>
                              sum +
                              (result.score / result.totalQuestions) * 100,
                            0
                          ) / completedQuizzes;

                        return (
                          <AccordionItem key={userId} value={userId}>
                            <AccordionTrigger>
                              <div className="flex justify-between w-full pr-4">
                                <span>{studentName}</span>
                                <div className="flex items-center space-x-4">
                                  <Badge
                                    variant="outline"
                                    className="flex items-center"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    <span>{completedQuizzes} bài kiểm tra</span>
                                  </Badge>
                                  <Badge
                                    className={`${
                                      avgScore >= 80
                                        ? "bg-green-100 text-green-800"
                                        : avgScore >= 60
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {Math.round(avgScore)}% avg
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Bài kiểm tra</TableHead>
                                    <TableHead>Điểm</TableHead>
                                    <TableHead>Tỷ lệ</TableHead>
                                    <TableHead>Ngày hoàn thành</TableHead>
                                    <TableHead>Lần làm bài</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {studentResults.map((result, idx) => {
                                    const quizInfo = quizMap[result.quizId] || {
                                      title: `Bài kiểm tra ${result.quizId.substring(
                                        0,
                                        8
                                      )}`,
                                    };
                                    const percentage =
                                      (result.score / result.totalQuestions) *
                                      100;

                                    return (
                                      <TableRow key={`${result.quizId}-${idx}`}>
                                        <TableCell className="font-medium">
                                          {quizInfo.title}
                                        </TableCell>
                                        <TableCell
                                          className={getScoreColor(
                                            result.score,
                                            result.totalQuestions
                                          )}
                                        >
                                          {result.score}/{result.totalQuestions}
                                        </TableCell>
                                        <TableCell>
                                          {percentage >= 80 ? (
                                            <span className="flex items-center text-green-600">
                                              <CheckCircle className="h-4 w-4 mr-1" />
                                              {Math.round(percentage)}%
                                            </span>
                                          ) : percentage >= 60 ? (
                                            <span className="flex items-center text-amber-600">
                                              <AlertTriangle className="h-4 w-4 mr-1" />
                                              {Math.round(percentage)}%
                                            </span>
                                          ) : (
                                            <span className="flex items-center text-red-600">
                                              <XCircle className="h-4 w-4 mr-1" />
                                              {Math.round(percentage)}%
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {formatDate(result.completionDate)}
                                        </TableCell>
                                        <TableCell>
                                          {result.attemptCount}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  );
                })()}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
