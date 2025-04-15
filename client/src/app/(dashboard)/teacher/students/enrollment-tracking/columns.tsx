"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Define the student type based on the API response
interface EnrolledStudent {
  userId: string;
  fullName: string;
  email: string;
  enrollmentDate: string;
  overallProgress: number;
  lastAccessDate: string;
}

// Format date function
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch (error) {
    return "Không có dữ liệu";
  }
};

export const columns: ColumnDef<EnrolledStudent>[] = [
  {
    accessorKey: "fullName",
    header: "Học viên",
    cell: ({ row }) => {
      return (
        <div>
          <p className="font-medium">{row.getValue("fullName")}</p>
          <p className="text-sm text-gray-500">{row.original.email}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "enrollmentDate",
    header: "Ngày đăng ký",
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span>{formatDate(row.getValue("enrollmentDate"))}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "overallProgress",
    header: "Tiến độ",
    cell: ({ row }) => {
      const progress = row.getValue("overallProgress") as number;

      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{progress}%</span>
            <Badge
              variant={
                progress >= 80
                  ? "default"
                  : progress >= 50
                    ? "secondary"
                    : "outline"
              }
              className={`text-xs ${
                progress >= 80
                  ? "bg-green-100 text-green-800 border-green-200"
                  : progress >= 50
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : ""
              }`}
            >
              {progress >= 80
                ? "Hoàn thành"
                : progress >= 50
                  ? "Đang tiến triển"
                  : "Mới bắt đầu"}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      );
    },
  },
  {
    accessorKey: "lastAccessDate",
    header: "Truy cập gần nhất",
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-gray-500" />
          <span>{formatDate(row.getValue("lastAccessDate"))}</span>
        </div>
      );
    },
  },
];
