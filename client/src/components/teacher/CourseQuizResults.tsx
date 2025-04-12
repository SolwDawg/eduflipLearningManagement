import React, { useState, useMemo, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCourseQuizResultsQuery, useGetUserQuery } from "@/state/api";
import LoadingAlternative from "@/components/LoadingAlternative";
import { formatDateString } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface QuizResult {
  quizId: string;
  score: number;
  maxScore: number;
  submittedAt: string;
  timeSpent: number;
  userId: string;
}

interface QuizResultsByQuiz {
  [quizId: string]: QuizResult[];
}

interface CourseQuizResultsProps {
  courseId: string;
}

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const QuizResultsSummary = ({
  quizResults,
  getUserName,
}: {
  quizResults: QuizResult[];
  getUserName: (userId: string) => string;
}) => {
  // Calculate average score
  const averageScore = useMemo(() => {
    if (quizResults.length === 0) return 0;
    const totalPercentage = quizResults.reduce(
      (sum, result) => sum + (result.score / result.maxScore) * 100,
      0
    );
    return Math.round(totalPercentage / quizResults.length);
  }, [quizResults]);

  // Calculate score distribution for pie chart
  const scoreDistribution = useMemo(() => {
    const distribution = {
      "0-20%": 0,
      "21-40%": 0,
      "41-60%": 0,
      "61-80%": 0,
      "81-100%": 0,
    };

    quizResults.forEach((result) => {
      const percentage = (result.score / result.maxScore) * 100;
      if (percentage <= 20) distribution["0-20%"]++;
      else if (percentage <= 40) distribution["21-40%"]++;
      else if (percentage <= 60) distribution["41-60%"]++;
      else if (percentage <= 80) distribution["61-80%"]++;
      else distribution["81-100%"]++;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [quizResults]);

  // Prepare data for average time spent chart
  const timeSpentData = useMemo(() => {
    const userTimes: Record<
      string,
      { totalTime: number; count: number; name: string }
    > = {};

    quizResults.forEach((result) => {
      if (!userTimes[result.userId]) {
        userTimes[result.userId] = {
          totalTime: 0,
          count: 0,
          name: getUserName(result.userId),
        };
      }

      userTimes[result.userId].totalTime += result.timeSpent;
      userTimes[result.userId].count += 1;
    });

    return Object.entries(userTimes)
      .map(([userId, data]) => ({
        userId,
        name: data.name,
        averageTime: Math.round(data.totalTime / data.count),
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5); // Top 5 users by time spent
  }, [quizResults, getUserName]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Điểm trung bình</CardTitle>
          <CardDescription>
            Tỷ lệ phần trăm trung bình của tất cả học sinh
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">
                {averageScore}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Dựa trên {quizResults.length} bài nộp
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Phân bố điểm số</CardTitle>
          <CardDescription>
            Phân bố điểm số của học sinh theo khoảng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {timeSpentData.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Thời gian làm bài trung bình (phút)
            </CardTitle>
            <CardDescription>
              Top 5 học sinh dành nhiều thời gian nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeSpentData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="averageTime"
                    name="Thời gian trung bình (phút)"
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const CourseQuizResults: React.FC<CourseQuizResultsProps> = ({ courseId }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { data, isLoading, error } = useGetCourseQuizResultsQuery(courseId);

  // Extract unique user IDs from the quiz results
  const uniqueUserIds = useMemo(() => {
    if (!data?.data?.allResults) return [];

    const userIds = new Set<string>();
    data.data.allResults.forEach((result: QuizResult) => {
      userIds.add(result.userId);
    });

    return Array.from(userIds);
  }, [data]);

  // Fetch user data for each student
  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingUsers(true);
      const userDataMap: Record<string, any> = {};

      // Sequential fetching to avoid too many parallel requests
      for (const userId of uniqueUserIds) {
        try {
          const response = await fetch(`/api/users/${userId}`);
          const userData = await response.json();

          if (userData && userData.data) {
            userDataMap[userId] = userData.data;
          }
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
        }
      }

      setUserMap(userDataMap);
      setLoadingUsers(false);
    };

    if (uniqueUserIds.length > 0) {
      fetchUserData();
    }
  }, [uniqueUserIds]);

  // Get the list of quizzes from the data
  const quizOptions = useMemo(() => {
    if (!data?.data?.byQuiz) return [];

    return Object.keys(data.data.byQuiz);
  }, [data]);

  // Set the first quiz as selected when data loads
  React.useEffect(() => {
    if (quizOptions.length > 0 && !selectedQuiz) {
      setSelectedQuiz(quizOptions[0]);
    }
  }, [quizOptions, selectedQuiz]);

  const getStudentName = (userId: string) => {
    const user = userMap[userId];
    return user
      ? user.fullName || user.username
      : `Student ${userId.substring(0, 5)}...`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <LoadingAlternative variant="spinner" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">
            Error Loading Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load quiz results. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.data?.allResults || data.data.allResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kết quả bài kiểm tra</CardTitle>
          <CardDescription>
            Không có kết quả bài kiểm tra nào cho khóa học này
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const byQuiz: QuizResultsByQuiz = data.data.byQuiz;
  const allResults: QuizResult[] = data.data.allResults;

  return (
    <div className="space-y-6">
      <QuizResultsSummary
        quizResults={allResults}
        getUserName={getStudentName}
      />

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Kết quả bài kiểm tra</CardTitle>
          <CardDescription>
            Hiệu suất bài kiểm tra của học sinh trong khóa học này
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers && (
            <div className="flex items-center justify-center mb-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <LoadingAlternative variant="spinner" size="sm" />
                <span>Đang tải thông tin học sinh...</span>
              </div>
            </div>
          )}

          <Tabs defaultValue="by-quiz" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="by-quiz">Theo bài kiểm tra</TabsTrigger>
              <TabsTrigger value="all-results">Tất cả kết quả</TabsTrigger>
            </TabsList>

            <TabsContent value="by-quiz" className="space-y-4">
              <div className="flex items-center">
                <label className="mr-2">Chọn bài kiểm tra:</label>
                <Select
                  value={selectedQuiz || ""}
                  onValueChange={(value) => setSelectedQuiz(value)}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Chọn bài kiểm tra" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizOptions.map((quizId) => (
                      <SelectItem key={quizId} value={quizId}>
                        {quizId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedQuiz && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Học sinh</TableHead>
                      <TableHead className="text-right">Điểm</TableHead>
                      <TableHead className="text-right">Điểm tối đa</TableHead>
                      <TableHead className="text-right">Phần trăm</TableHead>
                      <TableHead className="text-right">
                        Thời gian làm bài (phút)
                      </TableHead>
                      <TableHead>Thời gian nộp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byQuiz[selectedQuiz]?.map((result, index) => (
                      <TableRow key={`${result.userId}-${index}`}>
                        <TableCell className="font-medium">
                          {getStudentName(result.userId)}
                        </TableCell>
                        <TableCell className="text-right">
                          {result.score}
                        </TableCell>
                        <TableCell className="text-right">
                          {result.maxScore}
                        </TableCell>
                        <TableCell className="text-right">
                          {Math.round((result.score / result.maxScore) * 100)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {result.timeSpent}
                        </TableCell>
                        <TableCell>
                          {formatDateString(result.submittedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="all-results">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã bài kiểm tra</TableHead>
                    <TableHead className="w-[200px]">Học sinh</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                    <TableHead className="text-right">Điểm tối đa</TableHead>
                    <TableHead className="text-right">Phần trăm</TableHead>
                    <TableHead>Thời gian nộp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allResults.map((result, index) => (
                    <TableRow key={`all-${result.userId}-${index}`}>
                      <TableCell>{result.quizId}</TableCell>
                      <TableCell className="font-medium">
                        {getStudentName(result.userId)}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.score}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.maxScore}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.round((result.score / result.maxScore) * 100)}%
                      </TableCell>
                      <TableCell>
                        {formatDateString(result.submittedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseQuizResults;
