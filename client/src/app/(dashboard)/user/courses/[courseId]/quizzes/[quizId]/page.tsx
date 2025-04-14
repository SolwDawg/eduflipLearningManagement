"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import StudentQuizView from "@/components/StudentQuizView";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useGetQuizQuery } from "@/state/api";
import Loading from "@/components/Loading";
import { trackQuizResult } from "@/lib/studentProgressApi";

export default function StudentQuizPage() {
  const { courseId, quizId } = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { data: quiz, isLoading } = useGetQuizQuery(quizId as string);
  const searchParams = useSearchParams();
  const reviewMode = searchParams.get("review") === "true";

  const handleQuizComplete = async (score: number, totalPoints: number) => {
    try {
      if (!user?.id) return;

      // Only track results if not in review mode
      if (!reviewMode) {
        await trackQuizResult(
          user.id,
          courseId as string,
          quizId as string,
          score,
          totalPoints
        );
      }
    } catch (error) {
      console.error("Failed to track quiz result:", error);
    }
  };

  if (!isLoaded || isLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="container py-8">
        Vui lòng đăng nhập để xem bài kiểm tra này.
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/user/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Header
            title={quiz?.title || "Bài kiểm tra"}
            subtitle={
              reviewMode ? "Review your answers" : "Kiểm tra kiến thức của bạn"
            }
          />
        </div>
      </div>

      <StudentQuizView
        quizId={quizId as string}
        courseId={courseId as string}
        onComplete={handleQuizComplete}
        reviewMode={reviewMode}
      />
    </div>
  );
}
