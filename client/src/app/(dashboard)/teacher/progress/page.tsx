"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  ChevronRight,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
} from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { Progress } from "@/components/ui/progress";
import { getPlaceholderAnalytics } from "@/lib/studentProgressApi";

interface CourseProgress {
  id: string;
  title: string;
  studentCount: number;
  averageProgress: number;
  completionRate: number;
  materialAccessCount: number;
  quizAverage: number;
  discussionPostCount: number;
}

const TeacherProgressPage = () => {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get("/api/teacher/courses");

        // If no courses, use empty array
        if (!response.data || response.data.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Fetch additional analytics for each course
        const coursesWithAnalytics = await Promise.all(
          response.data.map(async (course: any) => {
            try {
              // Try to fetch real analytics
              const analyticsResponse = await axios.get(
                `/api/progress/analytics/course/${course.id}`
              );
              const analytics = analyticsResponse.data.data;

              return {
                id: course.id,
                title: course.title,
                studentCount: analytics.totalStudents || 0,
                averageProgress: analytics.averageProgress || 0,
                completionRate: analytics.quizData?.completionRate || 0,
                materialAccessCount:
                  analytics.materialAccessData?.totalAccesses || 0,
                quizAverage: analytics.quizData?.averageScore || 0,
                discussionPostCount: analytics.discussionData?.totalPosts || 0,
              };
            } catch (error) {
              console.warn(
                `Using placeholder data for course ${course.id} - API not available`
              );

              // Use placeholder data if API fails
              const placeholderData = getPlaceholderAnalytics(course.id);

              return {
                id: course.id,
                title: course.title,
                studentCount: placeholderData.totalStudents,
                averageProgress: placeholderData.averageProgress,
                completionRate: placeholderData.quizData.completionRate,
                materialAccessCount:
                  placeholderData.materialAccessData.totalAccesses,
                quizAverage: placeholderData.quizData.averageScore,
                discussionPostCount: placeholderData.discussionData.totalPosts,
              };
            }
          })
        );

        setCourses(coursesWithAnalytics);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const viewCourseProgress = (courseId: string) => {
    router.push(`/teacher/progress/course/${courseId}`);
  };

  return (
    <div className="container mx-auto p-6">
      <PageTitle
        title="Student Progress Analytics"
        description="Monitor student progress, material access, quiz results, and discussion participation"
      />

      {loading ? (
        <div className="flex justify-center my-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">No courses found</h3>
          <p className="text-muted-foreground mt-2">
            Create a course to start tracking student progress
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-2">
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{course.studentCount} students enrolled</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Progress</span>
                      <span className="font-medium">
                        {Math.round(course.averageProgress)}%
                      </span>
                    </div>
                    <Progress value={course.averageProgress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quiz Completion Rate</span>
                      <span className="font-medium">
                        {Math.round(course.completionRate)}%
                      </span>
                    </div>
                    <Progress value={course.completionRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                      <BookOpen className="h-5 w-5 text-blue-500 mb-1" />
                      <span className="text-xs text-center">
                        Material Views
                      </span>
                      <span className="font-semibold">
                        {course.materialAccessCount}
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                      <FileText className="h-5 w-5 text-green-500 mb-1" />
                      <span className="text-xs text-center">Quiz Avg</span>
                      <span className="font-semibold">
                        {Math.round(course.quizAverage)}%
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                      <MessageSquare className="h-5 w-5 text-purple-500 mb-1" />
                      <span className="text-xs text-center">Discussion</span>
                      <span className="font-semibold">
                        {course.discussionPostCount}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-2 flex justify-between items-center"
                    onClick={() => viewCourseProgress(course.id)}
                  >
                    <span className="flex items-center">
                      <BarChart className="mr-2 h-4 w-4" />
                      View Detailed Analytics
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherProgressPage;
