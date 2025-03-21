"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Quiz, QuizScope } from "@/types/quiz";
import { useGetQuizzesQuery } from "@/state/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StudentQuizListProps {
  courseId: string;
  sectionId?: string;
  chapterId?: string;
}

export default function StudentQuizList({
  courseId,
  sectionId,
  chapterId,
}: StudentQuizListProps) {
  const router = useRouter();
  const { data: quizzes, isLoading } = useGetQuizzesQuery({ courseId });

  // Filter quizzes based on scope
  const availableQuizzes = quizzes?.filter((quiz) => {
    // Only show published quizzes
    if (!quiz.isPublished) return false;

    // Handle different scopes
    if (chapterId && quiz.scope === QuizScope.CHAPTER) {
      return quiz.chapterId === chapterId;
    } else if (sectionId && quiz.scope === QuizScope.SECTION) {
      return quiz.sectionId === sectionId;
    } else if (quiz.scope === QuizScope.COURSE) {
      return true; // Course-level quizzes are always shown
    }
    return false;
  });

  const handleStartQuiz = (quizId: string) => {
    router.push(`/user/courses/${courseId}/quizzes/${quizId}`);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading quizzes...</div>;
  }

  if (!availableQuizzes || availableQuizzes.length === 0) {
    return null; // Don't show anything if no quizzes
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Available Quizzes</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {availableQuizzes.map((quiz) => (
          <Card key={quiz.quizId} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>{quiz.title}</CardTitle>
              <CardDescription>
                {quiz.questions.length} questions • Added{" "}
                {formatDate(quiz.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {quiz.description || "Take this quiz to test your knowledge."}
              </div>
              {quiz.timeLimit && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Time limit: {quiz.timeLimit} minutes</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleStartQuiz(quiz.quizId)}
                className="w-full"
              >
                Start Quiz <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
