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
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { getUserQuizResults } from "@/lib/studentProgressApi";
import { trackQuizResult } from "@/lib/studentProgressApi";

interface StudentQuizViewProps {
  quizId: string;
  courseId: string;
  onComplete?: (score: number, totalPoints: number) => void;
  reviewMode?: boolean;
}

export default function StudentQuizView({
  quizId,
  courseId,
  onComplete,
  reviewMode = false,
}: StudentQuizViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const { data: quiz, isLoading } = useGetQuizQuery(quizId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>(
    {}
  );
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(reviewMode);

  useEffect(() => {
    // Load previous quiz result if in review mode
    if (reviewMode && user) {
      const loadQuizResult = async () => {
        try {
          setIsLoadingResult(true);
          const results = await getUserQuizResults(user.id);
          const result = results.find((r) => r.quizId === quizId);
          if (result) {
            setQuizResult(result);
            setScore(result.score);
            setTotalPoints(result.totalQuestions);
            setQuizSubmitted(true);
          }
        } catch (error) {
          console.error("Error loading quiz result:", error);
        } finally {
          setIsLoadingResult(false);
        }
      };

      loadQuizResult();
    }
  }, [quizId, reviewMode, user]);

  useEffect(() => {
    if (!isLoading && quiz && quiz.timeLimit && !quizSubmitted && !reviewMode) {
      // Convert time limit from minutes to seconds
      const timeLimitInSeconds = quiz.timeLimit * 60;
      setTimeLeft(timeLimitInSeconds);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, isLoading, quizSubmitted, reviewMode]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const submitQuiz = () => {
    if (!quiz) return;

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

    // Save quiz result to database
    if (user) {
      const scorePercentage = Math.round(
        (earnedPoints / totalAvailablePoints) * 100
      );
      trackQuizResult(
        user.id,
        courseId,
        quizId,
        scorePercentage,
        quiz.questions.length
      ).catch((error) => {
        console.error("Error saving quiz result:", error);
        toast.error("Không thể lưu kết quả bài kiểm tra");
      });
    }

    toast.success("Nộp bài kiểm tra thành công!");
  };

  const handleFinishQuiz = async () => {
    // If quiz is submitted but not yet saved to database (user clicks "Hoàn tất đánh giá")
    if (quizSubmitted && user && !reviewMode) {
      try {
        // Make sure we have the necessary data
        if (!quiz) {
          console.error("Quiz data is missing");
          toast.error(
            "Không thể lưu kết quả bài kiểm tra - thiếu dữ liệu bài kiểm tra"
          );
          router.push(`/user/courses/${courseId}`);
          return;
        }

        // Calculate score percentage
        const scorePercentage = Math.round((score / totalPoints) * 100);

        // Save quiz result to database
        await trackQuizResult(
          user.id,
          courseId,
          quizId,
          scorePercentage,
          quiz.questions.length
        );

        toast.success("Kết quả bài kiểm tra đã được lưu thành công!");
      } catch (error) {
        console.error("Error saving quiz result:", error);
        toast.error("Không thể lưu kết quả bài kiểm tra");
      }
    }

    router.push(`/user/courses/${courseId}`);
  };

  if (isLoading || isLoadingResult) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Đang tải bài kiểm tra...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy bài kiểm tra</h2>
        <p className="mb-6">Bài kiểm tra bạn đang tìm kiếm không tồn tại.</p>
        <Button onClick={() => router.push(`/user/courses/${courseId}`)}>
          Trở lại khóa học
        </Button>
      </div>
    );
  }

  // Calculate progress percentage
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Get current question
  const currentQuestion = quiz.questions[currentQuestionIndex];

  const getOptionStatus = (question: any, optionId: string) => {
    if (!quizSubmitted && !reviewMode) return null;

    const isCorrect = question.options.find(
      (opt: any) => opt.optionId === optionId
    )?.isCorrect;

    const userSelected = answers[question.questionId] === optionId;

    if (isCorrect) return "correct";
    if (userSelected && !isCorrect) return "incorrect";
    return null;
  };

  const getCorrectAnswer = (question: any) => {
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      const correctOption = question.options.find((opt: any) => opt.isCorrect);
      return correctOption ? correctOption.text : "No correct answer provided";
    }
    return "N/A"; // For essay questions
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{quiz.title}</h2>
        {timeLeft !== null && !quizSubmitted && !reviewMode && (
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1" />
            <span>Thời gian còn lại: {formatTime(timeLeft)}</span>
          </div>
        )}
        {reviewMode && (
          <div className="flex items-center text-sm">
            <span className="font-medium mr-2">Score:</span>
            <span
              className={
                score / totalPoints >= 0.7 ? "text-green-600" : "text-red-600"
              }
            >
              {score}/{totalPoints} ({Math.round((score / totalPoints) * 100)}%)
            </span>
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
          {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
            <RadioGroup
              value={answers[currentQuestion.questionId] as string}
              onValueChange={(value) =>
                handleAnswerChange(currentQuestion.questionId, value)
              }
              disabled={quizSubmitted || reviewMode}
              className="space-y-3"
            >
              {currentQuestion.options?.map((option) => {
                const status = getOptionStatus(
                  currentQuestion,
                  option.optionId
                );
                return (
                  <div
                    key={option.optionId}
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      status === "correct"
                        ? "bg-green-50 border border-green-200"
                        : status === "incorrect"
                        ? "bg-red-50 border border-red-200"
                        : ""
                    }`}
                  >
                    <RadioGroupItem
                      value={option.optionId}
                      id={option.optionId}
                      disabled={quizSubmitted || reviewMode}
                    />
                    <Label
                      htmlFor={option.optionId}
                      className="flex-1 cursor-pointer"
                    >
                      {option.text}
                    </Label>
                    {status === "correct" && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {status === "incorrect" && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          )}

          {currentQuestion.type === QuestionType.ESSAY && (
            <div className="space-y-4">
              <Textarea
                placeholder="Enter your answer here..."
                value={(answers[currentQuestion.questionId] as string) || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.questionId, e.target.value)
                }
                disabled={quizSubmitted || reviewMode}
                className="min-h-[150px]"
              />

              {(quizSubmitted || reviewMode) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    Đánh giá tự luận:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Câu hỏi tự luận yêu cầu đánh giá bằng tay bởi giáo viên của
                    bạn.
                  </p>
                </div>
              )}
            </div>
          )}

          {(quizSubmitted || reviewMode) && (
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-md">
              <h3 className="font-medium mb-2">Giải thích câu trả lời</h3>
              {currentQuestion.type === QuestionType.MULTIPLE_CHOICE ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Câu trả lời đúng:{" "}
                    <span className="font-medium">
                      {getCorrectAnswer(currentQuestion)}
                    </span>
                  </p>
                  {(currentQuestion as any).explanation ? (
                    <p className="text-sm">
                      {(currentQuestion as any).explanation}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Không có giải thích được cung cấp.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Câu tự luận sẽ được đánh giá bởi giáo viên của bạn.
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Trang trước
          </Button>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button onClick={handleNextQuestion}>
              Trang tiếp
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : !quizSubmitted && !reviewMode ? (
            <Button
              onClick={submitQuiz}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              Gửi bài kiểm tra
            </Button>
          ) : (
            <Button onClick={handleFinishQuiz}>Hoàn tất đánh giá</Button>
          )}
        </CardFooter>
      </Card>

      {(quizSubmitted || reviewMode) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle>Kết quả bài kiểm tra</CardTitle>
            <CardDescription>
              Điểm của bạn: {score} trên {totalPoints} điểm (
              {Math.round((score / totalPoints) * 100)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Bạn có thể điều hướng qua câu hỏi để đánh giá lại câu trả lời của
              mình.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleFinishQuiz}
              className="w-full"
              variant="outline"
            >
              Trở lại khóa học
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
