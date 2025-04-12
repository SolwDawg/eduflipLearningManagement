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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  averageProgress: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  lastActive: string;
}

const AllStudentsProgress = () => {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllStudentsProgress = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/teachers/students/progress`
      );

      // Sort by average progress (descending)
      const sortedStudents = response.data.sort(
        (a: StudentProgress, b: StudentProgress) =>
          b.averageProgress - a.averageProgress
      );

      setStudents(sortedStudents);
    } catch (error) {
      console.error("Failed to fetch student progress data:", error);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllStudentsProgress();
  }, []);

  const handleRefresh = () => {
    fetchAllStudentsProgress(true);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressIndicatorColor = (progress: number) => {
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm học sinh..."
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
          className="ml-2"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Đang làm mới..." : "Làm mới"}
        </Button>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Không có dữ liệu học sinh nào được tìm thấy. Vui lòng thử làm mới
              hoặc kiểm tra lại sau.
            </p>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Không tìm thấy học sinh phù hợp với tìm kiếm của bạn.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tiến độ của tất cả học sinh</CardTitle>
            <CardDescription>
              Tổng quan về tiến độ học tập của tất cả học sinh trong tất cả các
              khóa học
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Tiến độ trung bình</TableHead>
                  <TableHead>Số khóa học đã đăng ký</TableHead>
                  <TableHead>Số khóa học đã hoàn thành</TableHead>
                  <TableHead>Hoạt động gần đây</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(
                              student.averageProgress
                            )}`}
                            style={{ width: `${student.averageProgress}%` }}
                          />
                        </div>
                        <span>{student.averageProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.coursesEnrolled}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.coursesCompleted > 0 ? "secondary" : "outline"
                        }
                      >
                        {student.coursesCompleted}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(student.lastActive).toLocaleDateString(
                          "vi-VN",
                          {
                            day: "numeric",
                            month: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AllStudentsProgress;
