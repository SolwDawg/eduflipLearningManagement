import React from "react";
import {
  useGetMonthlyLeaderboardQuery,
  useGetPublicMonthlyLeaderboardQuery,
} from "@/state/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string;
  totalScore: number;
  coursesAccessed: number;
  chaptersCompleted: number;
}

const TopRankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  }
  if (rank === 2) {
    return <Trophy className="h-5 w-5 text-gray-400" />;
  }
  if (rank === 3) {
    return <Trophy className="h-5 w-5 text-amber-700" />;
  }
  return <span className="font-semibold">{rank}</span>;
};

const MonthlyLeaderboard = () => {
  const { isSignedIn } = useUser();

  // Use the authenticated endpoint if signed in, otherwise use the public endpoint
  const authenticatedQuery = useGetMonthlyLeaderboardQuery(undefined, {
    skip: !isSignedIn,
  });
  const publicQuery = useGetPublicMonthlyLeaderboardQuery(undefined, {
    skip: isSignedIn,
  });

  // Use the appropriate query result based on auth status
  const { data, isLoading, error } = isSignedIn
    ? authenticatedQuery
    : publicQuery;

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">
            Đang tải bảng xếp hạng...
          </CardTitle>
        </CardHeader>
        <CardContent>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b last:border-0"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-14" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">
            Không thể tải bảng xếp hạng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-500">
            Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.
          </p>
        </CardContent>
      </Card>
    );
  }

  const leaderboard: LeaderboardEntry[] = data?.data || [];
  const month = data?.month || "tháng này";
  const year = data?.year || new Date().getFullYear();

  if (leaderboard.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">{`Bảng xếp hạng ${month} ${year}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">
            Chưa có dữ liệu xếp hạng cho tháng này. Hãy là người đầu tiên hoàn
            thành các bài học!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-center">{`Bảng xếp hạng ${month} ${year}`}</CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 py-3 border-b last:border-0 ${
              entry.rank <= 3
                ? "bg-gradient-to-r from-transparent to-amber-50/30 px-2 rounded-lg"
                : ""
            }`}
          >
            <div className="flex items-center justify-center h-8 w-8">
              <TopRankIcon rank={entry.rank} />
            </div>

            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarImage src={entry.avatarUrl} alt={entry.name} />
              <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-medium">{entry.name}</p>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{entry.chaptersCompleted} chương hoàn thành</span>
                <span>•</span>
                <span>{entry.coursesAccessed} khóa học</span>
              </div>
            </div>

            <Badge variant="secondary" className="ml-auto">
              {entry.totalScore} điểm
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MonthlyLeaderboard;
