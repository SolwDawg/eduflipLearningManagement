"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Student } from "@/types/global";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: "Họ tên",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("name")}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalCourses",
    header: "Khóa học",
    cell: ({ row }) => {
      return (
        <Badge
          variant="outline"
          className="bg-primary-50 text-primary-700 border-primary-200"
        >
          <BookOpen className="w-4 h-4 text-primary-600 mr-1" />
          {row.getValue("totalCourses")} khóa học
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalQuizzesTaken",
    header: "Bài kiểm tra",
    cell: ({ row }) => {
      const quizzesTaken = row.getValue("totalQuizzesTaken") as number;

      if (quizzesTaken === 0) {
        return <span className="text-muted-foreground text-sm">Chưa làm</span>;
      }

      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <FileText className="w-4 h-4 text-blue-600 mr-1" />
          {quizzesTaken} bài kiểm tra
        </Badge>
      );
    },
  },
  {
    accessorKey: "lastActivity",
    header: "Hoạt động cuối",
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <Calendar className="w-4 h-4 text-muted-foreground mr-1" />
          <span>
            {formatDistanceToNow(new Date(row.getValue("lastActivity")), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Link href={`/teacher/students/${row.original.studentId}`}>
            <Button size="sm" variant="outline">
              <ExternalLink className="h-4 w-4 mr-1" />
              Chi tiết
            </Button>
          </Link>
        </div>
      );
    },
  },
];
