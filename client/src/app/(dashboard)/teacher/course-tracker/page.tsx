"use client";

import React from "react";
import TeacherCourseTracker from "@/components/teacher/TeacherCourseTracker";
import PageTitle from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TeacherCourseTrackerPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/teacher/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageTitle title="Khoá học và bài kiểm tra" />
        </div>
      </div>

      <TeacherCourseTracker />
    </div>
  );
}
