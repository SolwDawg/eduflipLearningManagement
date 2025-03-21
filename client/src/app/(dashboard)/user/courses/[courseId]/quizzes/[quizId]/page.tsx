"use client";

import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import StudentQuizView from "@/components/StudentQuizView";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useGetQuizQuery } from "@/state/api";
import Loading from "@/components/Loading";

export default function StudentQuizPage() {
  const { courseId, quizId } = useParams();
  const { user, isLoaded } = useUser();
  const { data: quiz, isLoading } = useGetQuizQuery(quizId as string);

  if (!isLoaded || isLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="container py-8">Please sign in to view this quiz.</div>
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
            title={quiz?.title || "Quiz"}
            subtitle="Test your knowledge"
          />
        </div>
      </div>

      <StudentQuizView
        quizId={quizId as string}
        courseId={courseId as string}
      />
    </div>
  );
}
