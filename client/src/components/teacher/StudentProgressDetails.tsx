import React from "react";
import {
  useGetStudentProgressDetailsQuery,
  useGetStudentQuizResultsQuery,
} from "@/state/api";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  BookOpen,
  MessageSquare,
  CheckCircle,
  Calendar,
} from "lucide-react";
import LoadingAlternative from "@/components/LoadingAlternative";
import { formatDistanceToNow } from "date-fns";
import { formatDateString } from "@/lib/utils";

interface StudentProgressDetailsProps {
  courseId: string;
  userId: string;
}

const StudentProgressDetails = ({
  courseId,
  userId,
}: StudentProgressDetailsProps) => {
  const { data, isLoading, error, refetch } = useGetStudentProgressDetailsQuery(
    { courseId, userId }
  );

  const { data: quizResultsData, isLoading: isLoadingQuizzes } =
    useGetStudentQuizResultsQuery({ courseId, userId });

  if (isLoading) {
    return <LoadingAlternative variant="skeleton" size="lg" />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">
            Lỗi khi tải thông tin tiến độ học tập của học sinh
          </CardTitle>
          <CardDescription>
            Chúng tôi không thể tải thông tin tiến độ học tập của học sinh. Vui
            lòng thử lại sau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Thử lại
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không có dữ liệu</CardTitle>
          <CardDescription>
            Không có dữ liệu tiến độ học tập cho học sinh này trong khóa học
            này.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const {
    sectionsWithDetails,
    quizResults,
    discussionActivity,
    overallProgress,
  } = data.data;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Tiến độ học tập tổng thể
          </CardTitle>
          <CardDescription>
            Tiến độ học tập tổng thể của học sinh trong khóa học này
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={overallProgress} className="h-4 flex-1" />
            <span className="font-bold text-lg">{overallProgress}%</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sections">
        <TabsList className="mb-4">
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Sections & Chapters
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Kết quả bài kiểm tra
          </TabsTrigger>
          <TabsTrigger value="discussions" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Discussion Activity
          </TabsTrigger>
        </TabsList>

        {/* Sections and Chapters Tab */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Course Content Progress</CardTitle>
              <CardDescription>
                Chi tiết tiến độ học tập của học sinh qua các phần và chương
                trong khóa học
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sectionsWithDetails.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Không có dữ liệu phần mềm cho học sinh này.
                </p>
              ) : (
                <div className="space-y-6">
                  {sectionsWithDetails.map((section: any) => (
                    <div
                      key={section.sectionId}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">
                          {section.title}
                        </h3>
                        <Badge
                          variant={
                            section.progress === 100 ? "default" : "outline"
                          }
                        >
                          {section.progress}% Complete
                        </Badge>
                      </div>
                      <Progress value={section.progress} className="h-2 mb-4" />

                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Chapters
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Chapter</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Access Count</TableHead>
                            <TableHead>Last Accessed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.chapters.map((chapter: any) => (
                            <TableRow key={chapter.chapterId}>
                              <TableCell>{chapter.title}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    chapter.completed ? "default" : "outline"
                                  }
                                >
                                  {chapter.completed
                                    ? "Completed"
                                    : "In Progress"}
                                </Badge>
                              </TableCell>
                              <TableCell>{chapter.accessCount} times</TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span
                                    title={formatDate(chapter.lastAccessDate)}
                                  >
                                    {getTimeAgo(chapter.lastAccessDate)}
                                  </span>
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Results Tab */}
        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả bài kiểm tra</CardTitle>
              <CardDescription>
                Chi tiết kết quả các bài kiểm tra của học sinh trong khóa học
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingQuizzes ? (
                <LoadingAlternative variant="spinner" size="md" />
              ) : !quizResultsData ||
                !quizResultsData.data ||
                quizResultsData.data.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Học sinh chưa hoàn thành bài kiểm tra nào trong khóa học này.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bài kiểm tra</TableHead>
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
                    {quizResultsData.data.map((result: any, index: number) => (
                      <TableRow key={`quiz-${result.quizId}-${index}`}>
                        <TableCell>{result.quizId}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discussion Activity Tab */}
        <TabsContent value="discussions">
          <Card>
            <CardHeader>
              <CardTitle>Discussion Participation</CardTitle>
              <CardDescription>
                Hoạt động tham gia thảo luận trong khóa học
              </CardDescription>
            </CardHeader>
            <CardContent>
              {discussionActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Không có dữ liệu hoạt động thảo luận cho học sinh này.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discussionActivity.map((activity: any) => (
                      <TableRow key={activity.topicId}>
                        <TableCell>{activity.title}</TableCell>
                        <TableCell>
                          {activity.postsCount > 0 ? (
                            <Badge>{activity.postsCount} bài viết</Badge>
                          ) : (
                            <Badge variant="outline">Không có bài viết</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span title={formatDate(activity.lastActivity)}>
                            {getTimeAgo(activity.lastActivity)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProgressDetails;
