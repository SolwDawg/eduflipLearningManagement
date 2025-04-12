"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetCourseQuery,
  useGetQuizQuery,
  useUpdateQuizMutation,
  useAddQuizQuestionMutation,
  useUpdateQuizQuestionMutation,
  useDeleteQuizQuestionMutation,
} from "@/state/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, Save, Loader2, Edit } from "lucide-react";
import Link from "next/link";
import { Quiz, QuizScope, QuestionType } from "@/types/quiz";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as formidable from "formidable";

// Form schema
const quizFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề bài kiểm tra là bắt buộc"),
  description: z.string().optional(),
  timeLimit: z.number().optional(),
  isPublished: z.boolean().default(false),
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

// Question form schema
const questionFormSchema = z.object({
  type: z.enum([QuestionType.MULTIPLE_CHOICE, QuestionType.ESSAY]),
  text: z.string().min(1, "Câu hỏi là bắt buộc"),
  correctAnswer: z.string().optional(),
  points: z.number().min(1, "Điểm phải lớn hơn 0").default(1),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "Không bắt buộc"),
        isCorrect: z.boolean().default(false),
      })
    )
    .optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function EditQuiz() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [activeTab, setActiveTab] = useState("basic");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  // Fetch quiz data
  const { data: quiz, isLoading: isLoadingQuiz } = useGetQuizQuery(quizId);
  const { data: course, isLoading: isLoadingCourse } =
    useGetCourseQuery(courseId);

  // API mutations
  const [updateQuiz, { isLoading: isUpdatingQuiz }] = useUpdateQuizMutation();
  const [addQuestion, { isLoading: isAddingQuestion }] =
    useAddQuizQuestionMutation();
  const [updateQuestion, { isLoading: isUpdatingQuestion }] =
    useUpdateQuizQuestionMutation();
  const [deleteQuestion, { isLoading: isDeletingQuestion }] =
    useDeleteQuizQuestionMutation();

  // Quiz form
  const quizForm = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      timeLimit: undefined,
      isPublished: false,
    },
  });

  // Question form
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      type: QuestionType.MULTIPLE_CHOICE,
      text: "",
      correctAnswer: "",
      points: 1,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  });

  // Update form when quiz data is loaded
  useEffect(() => {
    if (quiz) {
      quizForm.reset({
        title: quiz.title,
        description: quiz.description || "",
        timeLimit: quiz.timeLimit,
        isPublished: quiz.isPublished,
      });
    }
  }, [quiz, quizForm]);

  // Watch for question type changes
  const selectedQuestionType = questionForm.watch("type");
  const questionOptions = questionForm.watch("options");

  const onSubmitQuiz = async (data: QuizFormValues) => {
    try {
      // Create a cleaned version of the data to avoid sending undefined values
      const cleanedData = {
        quizId,
        title: data.title,
        description: data.description || undefined, // Use undefined instead of null
        isPublished: data.isPublished,
        timeLimit: data.timeLimit === null ? undefined : data.timeLimit, // Match API type
      };

      console.log("Cập nhật bài kiểm tra với dữ liệu:", cleanedData);

      await updateQuiz(cleanedData).unwrap();
      toast.success("Bài kiểm tra đã được cập nhật thành công!");
    } catch (error) {
      console.error("Quiz update error:", error);
      toast.error("Không thể cập nhật bài kiểm tra. Vui lòng thử lại.");
    }
  };

  const startEditingQuestion = (questionId: string) => {
    setEditingQuestionId(questionId);
    const question = quiz?.questions.find((q) => q.questionId === questionId);

    if (question) {
      questionForm.reset({
        type: question.type as QuestionType,
        text: question.text,
        correctAnswer: question.correctAnswer || "",
        points: question.points,
        options: question.options || [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      });
    }
  };

  const cancelEditingQuestion = () => {
    setEditingQuestionId(null);
    setCreatingQuestion(false);
    questionForm.reset({
      type: QuestionType.MULTIPLE_CHOICE,
      text: "",
      correctAnswer: "",
      points: 1,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    });
  };

  const onSubmitQuestion = async (data: QuestionFormValues) => {
    if (editingQuestionId) {
      // Update existing question
      try {
        await updateQuestion({
          quizId,
          questionId: editingQuestionId,
          ...data,
        }).unwrap();

        toast.success("Câu hỏi đã được cập nhật thành công!");
        cancelEditingQuestion();
      } catch (error) {
        toast.error("Không thể cập nhật câu hỏi. Vui lòng thử lại.");
      }
    } else {
      // Add new question
      try {
        await addQuestion({
          quizId,
          ...data,
        }).unwrap();

        toast.success("Câu hỏi đã được thêm thành công!");
        cancelEditingQuestion();
      } catch (error) {
        toast.error("Không thể thêm câu hỏi. Vui lòng thử lại.");
      }
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
      try {
        await deleteQuestion({
          quizId,
          questionId,
        }).unwrap();

        toast.success("Câu hỏi đã được xóa thành công!");
      } catch (error) {
        toast.error("Không thể xóa câu hỏi. Vui lòng thử lại.");
      }
    }
  };

  const handleAddOption = () => {
    const currentOptions = questionForm.getValues("options") || [];
    questionForm.setValue("options", [
      ...currentOptions,
      { text: "", isCorrect: false },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = questionForm.getValues("options") || [];
    questionForm.setValue(
      "options",
      currentOptions.filter((_, i) => i !== index)
    );
  };

  const getScopeDisplay = (quiz: Quiz) => {
    switch (quiz.scope) {
      case QuizScope.CHAPTER:
        const sectionWithChapter = course?.sections?.find(
          (section) => section.sectionId === quiz.sectionId
        );
        const chapter = sectionWithChapter?.chapters?.find(
          (chapter) => chapter.chapterId === quiz.chapterId
        );
        return `Chapter: ${chapter?.title || "Unknown"}`;

      case QuizScope.SECTION:
        const section = course?.sections?.find(
          (section) => section.sectionId === quiz.sectionId
        );
        return `Section: ${section?.sectionTitle || "Unknown"}`;

      case QuizScope.COURSE:
      default:
        return "Toàn khóa học";
    }
  };

  if (isLoadingQuiz) {
    return (
      <div className="container py-6">
        <div className="text-center py-8">
          Đang tải thông tin bài kiểm tra...
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container py-6">
        <div className="text-center py-8">Bài kiểm tra không tồn tại</div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href={`/teacher/courses/${courseId}/quizzes`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Header
            title={`Sửa bài kiểm tra: ${quiz.title}`}
            subtitle={getScopeDisplay(quiz)}
          />
        </div>
        <p className="text-muted-foreground">
          {getScopeDisplay(quiz)} • Ngày tạo: {formatDate(quiz.createdAt)}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
          {/* <TabsTrigger value="questions">
            Câu hỏi ({quiz.questions.length})
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết bài kiểm tra</CardTitle>
              <CardDescription>
                Cập nhật thông tin cơ bản cho bài kiểm tra của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...quizForm}>
                <form
                  id="quiz-form"
                  onSubmit={quizForm.handleSubmit(onSubmitQuiz)}
                  className="space-y-6"
                >
                  <FormField
                    control={quizForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập tiêu đề bài kiểm tra"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quizForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả (Không bắt buộc)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Nhập mô tả bài kiểm tra"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quizForm.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Thời gian giới hạn (phút, không bắt buộc)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Không giới hạn thời gian"
                            onChange={(e) => {
                              const value = e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined;
                              field.onChange(value);
                            }}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quizForm.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Đã xuất bản
                          </FormLabel>
                          <FormDescription>
                            Cho phép bài kiểm tra này cho học sinh
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="quiz-form" disabled={isUpdatingQuiz}>
                {isUpdatingQuiz && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lưu thay đổi
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Câu hỏi</CardTitle>
                <CardDescription>Quản lý câu hỏi bài kiểm tra</CardDescription>
              </div>
              {!creatingQuestion && !editingQuestionId && (
                <Button
                  onClick={() => setCreatingQuestion(true)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm câu hỏi
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Editing or creating a question */}
                {(creatingQuestion || editingQuestionId) && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {editingQuestionId ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...questionForm}>
                        <form
                          id="question-form"
                          onSubmit={questionForm.handleSubmit(onSubmitQuestion)}
                          className="space-y-6"
                        >
                          <FormField
                            control={questionForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Loại câu hỏi</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Chọn loại câu hỏi" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem
                                      value={QuestionType.MULTIPLE_CHOICE}
                                    >
                                      Trắc nghiệm
                                    </SelectItem>
                                    <SelectItem value={QuestionType.ESSAY}>
                                      Tự luận
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={questionForm.control}
                            name="text"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nội dung câu hỏi</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Nhập nội dung câu hỏi"
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={questionForm.control}
                            name="points"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Điểm</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {selectedQuestionType ===
                          QuestionType.MULTIPLE_CHOICE ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-base">
                                  Câu trả lời
                                </FormLabel>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleAddOption}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Thêm câu trả
                                  lời
                                </Button>
                              </div>

                              {questionOptions?.map((_, index) => (
                                <div
                                  key={index}
                                  className="flex items-start space-x-3"
                                >
                                  <FormField
                                    control={questionForm.control}
                                    name={`options.${index}.isCorrect`}
                                    render={({ field }) => (
                                      <FormItem className="flex items-center space-x-2 space-y-0 pt-2">
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={questionForm.control}
                                    name={`options.${index}.text`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          <Input
                                            placeholder={`Option ${index + 1}`}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveOption(index)}
                                    disabled={questionOptions.length <= 2}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              ))}
                              <FormDescription>
                                Đánh dấu ít nhất một câu trả lời là đúng
                              </FormDescription>
                            </div>
                          ) : (
                            <FormField
                              control={questionForm.control}
                              name="correctAnswer"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Câu trả lời tham khảo (Không bắt buộc)
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Nhập câu trả lời tham khảo"
                                      className="min-h-[100px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Đây sẽ là tài liệu tham khảo cho việc chấm
                                    điểm, nhưng sẽ không được hiển thị cho học
                                    sinh
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEditingQuestion}
                      >
                        Hủy bỏ
                      </Button>
                      <Button
                        type="submit"
                        form="question-form"
                        disabled={isAddingQuestion || isUpdatingQuestion}
                      >
                        {(isAddingQuestion || isUpdatingQuestion) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingQuestionId
                          ? "Cập nhật câu hỏi"
                          : "Thêm câu hỏi"}
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {/* List of existing questions */}
                {quiz.questions.length === 0 && !creatingQuestion ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên để bắt đầu.
                    </p>
                    <Button
                      onClick={() => setCreatingQuestion(true)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm câu hỏi
                    </Button>
                  </div>
                ) : (
                  quiz.questions.map((question, index) => (
                    <Card
                      key={question.questionId}
                      className={`bg-muted/40 ${
                        editingQuestionId === question.questionId
                          ? "border-primary"
                          : ""
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">
                              Question {index + 1} (
                              {question.type === QuestionType.MULTIPLE_CHOICE
                                ? "Trắc nghiệm"
                                : "Tự luận"}
                              ) - {question.points}{" "}
                              {question.points === 1 ? "điểm" : "điểm"}
                            </div>
                            <div className="font-medium">{question.text}</div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                startEditingQuestion(question.questionId)
                              }
                              disabled={!!editingQuestionId || creatingQuestion}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteQuestion(question.questionId)
                              }
                              disabled={isDeletingQuestion}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {question.type === QuestionType.MULTIPLE_CHOICE ? (
                          <div className="grid gap-2">
                            {question.options?.map((option, i) => (
                              <div
                                key={option.optionId}
                                className={`p-2 rounded-md text-sm ${
                                  option.isCorrect
                                    ? "bg-primary-700 text-white-100 border border-primary-600"
                                    : "bg-customgreys-secondarybg text-white-50 border border-customgreys-darkerGrey"
                                }`}
                              >
                                {option.isCorrect && (
                                  <span className="text-white-100 font-medium mr-2">
                                    ✓
                                  </span>
                                )}
                                {option.text}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-customgreys-secondarybg border border-customgreys-darkerGrey p-3 rounded-md text-sm text-white-50">
                            <div className="text-muted-foreground mb-1">
                              Câu trả lời tham khảo:
                            </div>
                            {question.correctAnswer ||
                              "(Không có câu trả lời tham khảo)"}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
