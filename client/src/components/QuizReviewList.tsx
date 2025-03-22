"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Award, Calendar, FileText, Info, Eye } from "lucide-react";
import {
  QuizResultSummary,
  getUserQuizResults,
} from "@/lib/studentProgressApi";
import { useGetCourseQuery } from "@/state/api";

interface QuizReviewListProps {
  userId: string;
}

export default function QuizReviewList({ userId }: QuizReviewListProps) {
  const [quizResults, setQuizResults] = useState<QuizResultSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courseNames, setCourseNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchQuizResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching quiz results for user:", userId);
        const results = await getUserQuizResults(userId);
        console.log("Received quiz results:", results);
        setQuizResults(results || []);

        // Get unique course IDs
        const uniqueCourseIds =
          results && results.length > 0
            ? [...new Set(results.map((r) => r.courseId))]
            : [];
        console.log("Unique course IDs:", uniqueCourseIds);

        // Fetch course names for each unique course ID
        const courseNameMap: Record<string, string> = {};
        for (const courseId of uniqueCourseIds) {
          try {
            const response = await fetch(`/api/courses/${courseId}`);
            const data = await response.json();
            if (data && data.title) {
              courseNameMap[courseId] = data.title;
            } else {
              courseNameMap[courseId] = "Unknown Course";
            }
          } catch (error) {
            console.error(`Error fetching course ${courseId}:`, error);
            courseNameMap[courseId] = "Unknown Course";
          }
        }

        setCourseNames(courseNameMap);
      } catch (error) {
        console.error("Error fetching quiz results:", error);
        setError("Failed to load quiz results. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchQuizResults();
    }
  }, [userId]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  const getScoreColor = (score: number, totalQuestions: number) => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return <div className="py-6 text-center">Loading quiz results...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quiz Results</CardTitle>
          <CardDescription>
            There was a problem loading your quiz results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-16 w-16 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-1">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quizResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quiz Results</CardTitle>
          <CardDescription>
            Bạn chưa hoàn thành bài kiểm tra nào.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">
              Không có kết quả bài kiểm tra
            </h3>
            <p className="text-muted-foreground mb-4">
              Hoàn thành bài kiểm tra trong khóa học của bạn để xem kết quả ở
              đây.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Kết quả bài kiểm tra</CardTitle>
        <CardDescription>
          Đánh giá lại bài kiểm tra đã hoàn thành và điểm số của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bài kiểm tra</TableHead>
                <TableHead>Khóa học</TableHead>
                <TableHead>Điểm số</TableHead>
                <TableHead>Ngày hoàn thành</TableHead>
                <TableHead>Lần thử</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizResults.map((result, index) => (
                <TableRow key={`${result.quizId}-${index}`}>
                  <TableCell className="font-medium">
                    Quiz {result.quizId.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {courseNames[result.courseId] || "Unknown Course"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${getScoreColor(
                        result.score,
                        result.totalQuestions
                      )}`}
                    >
                      {result.score}/{result.totalQuestions}{" "}
                      <span className="text-xs">
                        (
                        {Math.round(
                          (result.score / result.totalQuestions) * 100
                        )}
                        %)
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      {formatDate(result.completionDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {result.attemptCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/user/courses/${result.courseId}/quizzes/${result.quizId}`
                        )
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Đánh giá lại
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
