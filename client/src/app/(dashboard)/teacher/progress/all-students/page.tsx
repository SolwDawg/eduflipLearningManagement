"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import AllStudentsProgress from "@/components/AllStudentsProgress";

const AllStudentsProgressPage = () => {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 mr-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Phân tích tiến độ tất cả học sinh
        </h1>
      </div>
      <div className="mt-6">
        <AllStudentsProgress />
      </div>
    </div>
  );
};

export default AllStudentsProgressPage;
