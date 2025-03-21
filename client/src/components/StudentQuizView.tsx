"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetQuizQuery } from "@/state/api";
import { QuestionType } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface StudentQuizViewProps {
  quizId: string;
  courseId: string;
  onComplete?: (score: number, totalPoints: number) => void;
}

export default function StudentQuizView({
  quizId,
  courseId,
  onComplete,
}: StudentQuizViewProps) {
  const router = useRouter();
  const { data: quiz, isLoading } = useGetQuizQuery(quizId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>(
    {}
  );
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  useEffect(() => {
    if (quiz?.timeLimit) {
      // Set timer in seconds
      setTimeLeft(quiz.timeLimit * 60);
    }
  }, [quiz]);

  useEffect(() => {
    if (timeLeft === null) return;

    // Set up timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          // Submit quiz automatically when time expires
          if (!quizSubmitted) {
            submitQuiz();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quizSubmitted]);

  if (isLoading) {
    return <div className="text-center py-8">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="text-center py-8">Quiz not found</div>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const submitQuiz = () => {
    // Calculate score
    let earnedPoints = 0;
    let totalAvailablePoints = 0;

    quiz.questions.forEach((question) => {
      totalAvailablePoints += question.points || 1;

      const userAnswer = answers[question.questionId];

      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        const correctOptions = question.options
          ?.filter((opt) => opt.isCorrect)
          .map((opt) => opt.optionId);

        // For multiple choice, check if answer is correct
        if (correctOptions?.includes(userAnswer as string)) {
          earnedPoints += question.points || 1;
        }
      }
      // For essay questions, we would need manual grading
      // Here we're just accepting any answer as valid for now
      else if (question.type === QuestionType.ESSAY && userAnswer) {
        // Count as partially correct by default for essays (would require teacher review)
        earnedPoints += (question.points || 1) / 2;
      }
    });

    setScore(earnedPoints);
    setTotalPoints(totalAvailablePoints);
    setQuizSubmitted(true);

    // Notify parent component
    if (onComplete) {
      onComplete(earnedPoints, totalAvailablePoints);
    }

    toast.success("Quiz submitted successfully!");
  };

  const handleFinishQuiz = () => {
    router.push(`/user/courses/${courseId}`);
  };

  if (quizSubmitted) {
    const percentage = totalPoints
      ? Math.round((score! / totalPoints) * 100)
      : 0;

    return (
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>
            You scored {score} out of {totalPoints} points ({percentage}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-primary/30 flex items-center justify-center">
              <span className="text-2xl font-bold">{percentage}%</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg">Thank you for completing the quiz!</p>
            {percentage >= 70 ? (
              <p className="text-green-600 flex items-center justify-center">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Good job!
              </p>
            ) : (
              <p className="text-amber-600">
                You may want to review the material.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleFinishQuiz}>Return to Course</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{quiz.title}</h2>
        {timeLeft !== null && (
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1" />
            <span>Time left: {formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-start">
            <span className="mr-2">Q{currentQuestionIndex + 1}.</span>
            <span>{currentQuestion.text}</span>
          </CardTitle>
          <CardDescription>
            {currentQuestion.points || 1}{" "}
            {currentQuestion.points === 1 ? "point" : "points"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === QuestionType.MULTIPLE_CHOICE ? (
            <RadioGroup
              value={(answers[currentQuestion.questionId] as string) || ""}
              onValueChange={(value: any) =>
                handleAnswerChange(currentQuestion.questionId, value)
              }
              className="space-y-2"
            >
              {currentQuestion.options?.map((option) => {
                const isSelected =
                  answers[currentQuestion.questionId] === option.optionId;
                return (
                  <div
                    key={option.optionId}
                    className={`flex items-center space-x-2 py-2 px-3 rounded-md transition-colors 
                      ${
                        isSelected
                          ? "bg-primary-700 text-white-100 border border-primary-600"
                          : "bg-customgreys-secondarybg text-white-50 hover:bg-customgreys-darkerGrey"
                      }`}
                  >
                    <RadioGroupItem
                      value={option.optionId}
                      id={option.optionId}
                    />
                    <Label
                      htmlFor={option.optionId}
                      className="cursor-pointer flex-grow"
                    >
                      {option.text}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          ) : (
            <Textarea
              placeholder="Type your answer here..."
              className="min-h-[150px]"
              value={(answers[currentQuestion.questionId] as string) || ""}
              onChange={(e) =>
                handleAnswerChange(currentQuestion.questionId, e.target.value)
              }
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button onClick={handleNextQuestion}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submitQuiz}>Submit Quiz</Button>
          )}
        </CardFooter>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </div>

        <Button variant="ghost" size="sm" onClick={submitQuiz}>
          Finish Quiz Early
        </Button>
      </div>
    </div>
  );
}
