"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useGetStudentsOverviewQuery } from "@/state/api";
import {
  Loader2,
  Users,
  BookOpen,
  AlertCircle,
  Search,
  FileText,
  Award,
  BarChart,
  ListChecks,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Student, StudentCourse } from "@/types/global";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageTitle from "@/components/PageTitle";

interface StudentsData {
  totalStudents: number;
  students: Student[];
}

const StudentsOverviewPage = () => {
  const { data, isLoading, error } = useGetStudentsOverviewQuery();
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <Header
          title="Tổng quan học sinh"
          subtitle="Xem tổng quan về tất cả học sinh đã đăng ký khóa học của bạn"
        />
        <div className="flex items-center justify-center min-h-[400px] mt-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          <span className="ml-2 text-primary-700">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Header
          title="Tổng quan học sinh"
          subtitle="Xem tổng quan về tất cả học sinh đã đăng ký khóa học của bạn"
        />
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 rounded-lg border border-red-200 mt-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <h3 className="text-xl font-medium text-primary-700">
            Không thể tải dữ liệu
          </h3>
          <p className="text-primary-600 mt-1">
            Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.
          </p>
        </div>
      </div>
    );
  }

  // Get the data from the response, handling both direct data and nested data structures
  const responseData = data as unknown;
  let studentsData: StudentsData;

  // Debug output
  console.log("Raw response data:", data);

  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    console.log("Using nested data structure");
    studentsData = (responseData as { data: StudentsData }).data;
  } else {
    console.log("Using direct data structure");
    studentsData = (responseData as StudentsData) || {
      totalStudents: 0,
      students: [],
    };
  }

  console.log("Processed data:", studentsData);
  console.log("Students array:", studentsData.students);
  console.log("Total students:", studentsData.totalStudents);

  // Filter students based on search term
  const filteredStudents = studentsData.students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentCards = [
    {
      title: "Theo dõi đăng ký khoá học",
      description:
        "Xem thông tin chi tiết về học viên đã đăng ký khoá học của bạn",
      icon: <ListChecks className="h-6 w-6 text-primary-600" />,
      href: "/teacher/students/enrollment-tracking",
      color: "bg-primary-50 border-primary-100",
    },
    {
      title: "Theo dõi hoàn thành bài kiểm tra",
      description:
        "Xem thông tin chi tiết về học viên đã hoàn thành bài kiểm tra trong khóa học",
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      href: "/teacher/students/quiz-tracking",
      color: "bg-green-50 border-green-100",
    },
  ];

  return (
    <div className="container mx-auto p-6 mb-6">
      <PageTitle
        title="Quản lý học viên"
        description="Theo dõi và quản lý học viên trong các khoá học của bạn"
        icon={<Users className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {studentCards.map((card, index) => (
          <Link href={card.href} key={index} className="block">
            <Card
              className={`h-full hover:shadow-md transition-all ${card.color} border`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  {card.icon}
                  <CardTitle>{card.title}</CardTitle>
                </div>
                <CardDescription className="ml-9">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Nhấp để xem chi tiết</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="dashboard-container">
        <Header
          title="Tổng quan học sinh"
          subtitle="Xem tổng quan về tất cả học sinh đã đăng ký khóa học của bạn"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-primary-800 text-lg font-medium">
                Tổng số học sinh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="w-8 h-8 text-primary-600 mr-3" />
                <span className="text-3xl font-bold text-primary-800">
                  {studentsData.totalStudents}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* More stats cards could be added here */}
        </div>

        {/* Search field */}
        <div className="mb-6 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 h-5 w-5" />
            <Input
              type="text"
              placeholder="Tìm kiếm học sinh theo tên hoặc email..."
              className="pl-10 bg-white border-primary-200 text-primary-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <h2 className="text-xl font-medium text-primary-800 mb-4">
          Danh sách học sinh
        </h2>

        <div className="space-y-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <Card
                key={student.studentId}
                className="overflow-hidden border-primary-100"
              >
                <div className="p-4 border-b border-primary-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-primary-800">
                        {student.name}
                      </h3>
                      <p className="text-primary-600">{student.email}</p>
                    </div>
                    <div className="mt-2 md:mt-0 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-primary-50 text-primary-700 border-primary-200"
                      >
                        <BookOpen className="w-4 h-4 text-primary-600 mr-1" />
                        {student.totalCourses} khóa học
                      </Badge>
                      {student.totalQuizzesTaken > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <FileText className="w-4 h-4 text-blue-600 mr-1" />
                          {student.totalQuizzesTaken} bài kiểm tra
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="bg-primary-50 text-primary-700 border-primary-200"
                      >
                        Hoạt động cuối:{" "}
                        {formatDistanceToNow(new Date(student.lastActivity), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h4 className="font-medium text-primary-700 mb-3">
                    Các khóa học đã đăng ký
                  </h4>
                  <div className="space-y-4">
                    {student.courses && student.courses.length > 0 ? (
                      student.courses.map((course) => (
                        <div
                          key={course.courseId}
                          className="border border-primary-100 rounded-lg p-3"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                            <h5 className="font-medium text-primary-800">
                              {course.title}
                            </h5>
                            <span className="text-sm text-primary-600">
                              Hoạt động cuối:{" "}
                              {formatDistanceToNow(
                                new Date(course.lastActivity),
                                {
                                  addSuffix: true,
                                  locale: vi,
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-primary-700">
                              Tiến độ: {course.completedChapters}/
                              {course.totalChapters} bài học
                            </span>
                            <span className="text-sm font-medium text-primary-800">
                              {course.completionPercentage}
                            </span>
                          </div>
                          <Progress
                            value={course.completionPercentage}
                            className="h-2 bg-primary-100"
                          />

                          {/* Quiz Information */}
                          {course.totalQuizzesTaken > 0 && (
                            <div className="mt-3 pt-3 border-t border-primary-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-primary-700">
                                  <FileText className="w-3 h-3 inline mr-1" />
                                  Bài kiểm tra đã làm:{" "}
                                  {course.totalQuizzesTaken}
                                </span>
                              </div>

                              {course.quizResults &&
                                course.quizResults.length > 0 && (
                                  <div className="mt-2 bg-blue-50 p-2 rounded text-sm">
                                    <p className="text-blue-700 font-medium">
                                      Bài kiểm tra gần đây nhất:
                                    </p>
                                    <div className="flex flex-col mt-1">
                                      <div className="text-blue-600 font-medium">
                                        {course.quizResults[0].quizTitle ||
                                          `Bài kiểm tra #${course.quizResults[0].quizId.substring(
                                            0,
                                            8
                                          )}`}
                                      </div>
                                      <div className="flex justify-between mt-1">
                                        <span className="text-blue-600">
                                          Điểm số:{" "}
                                          {course.quizResults[0].score / 10}
                                        </span>
                                        <span className="text-blue-600">
                                          {formatDistanceToNow(
                                            new Date(
                                              course.quizResults[0].completionDate
                                            ),
                                            {
                                              addSuffix: true,
                                              locale: vi,
                                            }
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-primary-600 text-center py-4">
                        Chưa có thông tin khóa học
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 border border-primary-100 rounded-lg bg-primary-50">
              <p className="text-primary-600">
                {searchTerm
                  ? `Không tìm thấy học sinh phù hợp với "${searchTerm}".`
                  : "Chưa có học sinh nào đăng ký khóa học của bạn."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsOverviewPage;
