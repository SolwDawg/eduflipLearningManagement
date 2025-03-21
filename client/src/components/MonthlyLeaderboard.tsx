"use client";

import React from "react";
import { useGetMonthlyLeaderboardQuery } from "@/state/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, User } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LoadingSkeleton = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const MonthlyLeaderboard = () => {
  const { data: leaderboardData, isLoading } = useGetMonthlyLeaderboardQuery();

  if (isLoading) return <LoadingSkeleton />;

  // If there's an error or no data, return nothing
  if (!leaderboardData?.data || leaderboardData.data.length === 0) return null;

  // Get top 3 students only
  const topStudents = leaderboardData.data.slice(0, 3);

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-bold">
            Bảng xếp hạng tháng {leaderboardData.month} {leaderboardData.year}
          </span>
          <Trophy className="h-6 w-6 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {topStudents.map((student: any, index: number) => (
          <div
            key={student.userId}
            className={cn(
              "flex items-center p-3 rounded-lg mb-3",
              index === 0
                ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200"
                : index === 1
                ? "bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200"
                : index === 2
                ? "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200"
                : ""
            )}
          >
            <div
              className={cn(
                "relative flex-shrink-0 w-10 h-10 rounded-full mr-4 flex items-center justify-center text-white font-bold",
                index === 0
                  ? "bg-yellow-500"
                  : index === 1
                  ? "bg-slate-400"
                  : "bg-amber-600"
              )}
            >
              {index + 1}
            </div>
            <div className="flex-shrink-0 relative h-12 w-12 rounded-full overflow-hidden border-2 border-white">
              <Image
                src={student.avatarUrl || "/default-avatar.png"}
                alt={student.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="font-semibold text-sm">{student.name}</h3>
              <div className="flex text-xs text-gray-500 mt-1 space-x-3">
                <span>{student.totalScore} điểm</span>
                <span>{student.chaptersCompleted} bài học</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MonthlyLeaderboard;
