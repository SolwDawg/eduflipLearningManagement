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
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

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

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách học viên</CardTitle>
            <CardDescription>
              Tổng cộng có {studentsData.totalStudents} học viên đã đăng ký khóa
              học
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={studentsData.students}
              searchKey="name"
              searchPlaceholder="Tìm kiếm học viên theo tên..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentsOverviewPage;
