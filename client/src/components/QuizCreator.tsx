"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { QuestionType, QuizScope } from "@/types/quiz";
import { useCreateQuizMutation, useAddQuizQuestionMutation } from "@/state/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Switch } from "./ui/switch";

// Form schema
const quizFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  description: z.string().optional(),
  scope: z.enum([QuizScope.CHAPTER, QuizScope.SECTION, QuizScope.COURSE]),
  courseId: z.string().min(1, "Course ID là bắt buộc"),
  sectionId: z.string().optional(),
  chapterId: z.string().optional(),
  timeLimit: z.number().optional(),
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

// Question form schema
const questionFormSchema = z.object({
  type: z.enum([QuestionType.MULTIPLE_CHOICE, QuestionType.ESSAY]),
  text: z.string().min(1, "Nội dung câu hỏi là bắt buộc"),
  correctAnswer: z.string().optional(),
  points: z.number().min(1, "Điểm phải lớn hơn 0").default(1),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "Nội dung câu trả lời là bắt buộc"),
        isCorrect: z.boolean().default(false),
      })
    )
    .optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuizCreatorProps {
  courseId: string;
  sections: Array<{
    sectionId: string;
    title: string;
    chapters: Array<{ chapterId: string; title: string }>;
  }>;
}

// Memoized option component for better performance
const Option = memo(
  ({
    index,
    register,
    errors,
    setValue,
    getValues,
    onRemove,
  }: {
    index: number;
    register: any;
    errors: any;
    setValue: any;
    getValues: any;
    onRemove: (index: number) => void;
  }) => {
    const handleCorrectChange = useCallback(
      (checked: boolean) => {
        setValue(`options.${index}.isCorrect`, checked);
      },
      [setValue, index]
    );

    return (
      <div className="flex items-start space-x-2 mb-3">
        <div className="flex-1">
          <Input
            {...register(`options.${index}.text`)}
            placeholder={`Tùy chọn ${index + 1}`}
            className={errors?.options?.[index]?.text ? "border-red-500" : ""}
          />
          {errors?.options?.[index]?.text && (
            <p className="text-red-500 text-xs mt-1">
              {errors.options[index].text.message}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={getValues(`options.${index}.isCorrect`)}
            onCheckedChange={handleCorrectChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);
Option.displayName = "Option";

export default function QuizCreator({ courseId, sections }: QuizCreatorProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [quizCreated, setQuizCreated] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // API hooks
  const [createQuiz, { isLoading: isCreatingQuiz }] = useCreateQuizMutation();
  const [addQuestion, { isLoading: isAddingQuestion }] =
    useAddQuizQuestionMutation();

  // Quiz form
  const quizForm = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      scope: QuizScope.COURSE,
      courseId,
      sectionId: "",
      chapterId: "",
      timeLimit: undefined,
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

  // Watch for scope changes
  const selectedScope = quizForm.watch("scope");

  // Watch for question type changes
  const selectedQuestionType = questionForm.watch("type");
  const questionOptions = questionForm.watch("options");

  const onSubmitQuiz = useCallback(
    async (data: QuizFormValues) => {
      try {
        // Ensure timeLimit is properly handled as number | undefined only
        const formattedData = {
          ...data,
          timeLimit: data.timeLimit === null ? undefined : data.timeLimit,
        };

        const result = await createQuiz(formattedData).unwrap();

        setQuizCreated(true);
        setQuizId(result.quizId);
        toast.success("Bài kiểm tra đã được tạo thành công!");
      } catch (error) {
        console.error("Error creating quiz:", error);
        toast.error("Không thể tạo bài kiểm tra. Vui lòng thử lại.");
      }
    },
    [createQuiz, setQuizCreated, setQuizId]
  );

  const onSubmitQuestion = useCallback(
    async (data: QuestionFormValues) => {
      if (!quizId) return;

      // For multiple choice, ensure at least one option is marked correct
      if (data.type === QuestionType.MULTIPLE_CHOICE) {
        const hasCorrectOption = data.options?.some((opt) => opt.isCorrect);
        if (!hasCorrectOption) {
          toast.error("Vui lòng đánh dấu ít nhất một câu trả lời là đúng");
          return;
        }
      }

      try {
        const result = await addQuestion({
          quizId,
          ...data,
        }).unwrap();

        setQuestions((prev) => [...prev, result]);
        toast.success("Câu hỏi đã được thêm thành công!");

        // Reset form
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
        setCreatingQuestion(false);
      } catch (error) {
        toast.error("Không thể thêm câu hỏi. Vui lòng thử lại.");
      }
    },
    [quizId, addQuestion, questionForm, setQuestions, setCreatingQuestion]
  );

  const handleAddOption = useCallback(() => {
    const currentOptions = questionForm.getValues("options") || [];
    questionForm.setValue("options", [
      ...currentOptions,
      { text: "", isCorrect: false },
    ]);
  }, [questionForm]);

  // Replace with useCallback to memoize the handler
  const handleRemoveOption = useCallback(
    (index: number) => {
      const currentOptions = questionForm.getValues("options") || [];
      if (currentOptions.length <= 2) {
        toast.error("Cần có ít nhất 2 tùy chọn");
        return;
      }

      const newOptions = currentOptions.filter((_, i) => i !== index);
      questionForm.setValue("options", newOptions);
    },
    [questionForm]
  );

  // Memoize the section options
  const sectionOptions = useMemo(() => {
    return sections.map((section) => ({
      value: section.sectionId,
      label: section.title,
    }));
  }, [sections]);

  // Memoize the chapter options based on selected section
  const chapterOptions = useMemo(() => {
    if (!selectedSection) return [];

    const section = sections.find((s) => s.sectionId === selectedSection);
    if (!section) return [];

    return section.chapters.map((chapter) => ({
      value: chapter.chapterId,
      label: chapter.title,
    }));
  }, [sections, selectedSection]);

  return (
    <div className="space-y-8">
      {(() => {
        try {
          return (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tạo bài kiểm tra mới</CardTitle>
                      <CardDescription>
                        Thiết lập thông tin cơ bản cho bài kiểm tra của bạn
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
                                <FormLabel>Tiêu đề bài kiểm tra</FormLabel>
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
                                <FormLabel>Mô tả (Tùy chọn)</FormLabel>
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
                            name="scope"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phạm vi bài kiểm tra</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Chọn phạm vi bài kiểm tra" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={QuizScope.COURSE}>
                                      Toàn khóa học
                                    </SelectItem>
                                    <SelectItem value={QuizScope.SECTION}>
                                      chương
                                    </SelectItem>
                                    <SelectItem value={QuizScope.CHAPTER}>
                                      Bài học
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Chọn phạm vi bài kiểm tra là toàn khóa học,
                                  một chương hoặc một bài học
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {selectedScope === QuizScope.SECTION ||
                          selectedScope === QuizScope.CHAPTER ? (
                            <FormField
                              control={quizForm.control}
                              name="sectionId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Chương</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      setSelectedSection(value);
                                      // Clear chapter selection if section changes
                                      quizForm.setValue("chapterId", "");
                                    }}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Chọn chương" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {sectionOptions.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ) : null}

                          {selectedScope === QuizScope.CHAPTER &&
                          selectedSection ? (
                            <FormField
                              control={quizForm.control}
                              name="chapterId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bài học</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Chọn bài học" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {chapterOptions.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ) : null}

                          <FormField
                            control={quizForm.control}
                            name="timeLimit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Thời gian giới hạn (phút, tùy chọn)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="Không có giới hạn thời gian"
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
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        type="submit"
                        form="quiz-form"
                        disabled={isCreatingQuiz}
                      >
                        {isCreatingQuiz && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Tạo bài kiểm tra
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>

              {quizCreated && quizId && (
                <div className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Câu hỏi</CardTitle>
                      <CardDescription>
                        Thêm câu hỏi vào bài kiểm tra của bạn
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {questions.length === 0 && !creatingQuestion ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">
                            Không có câu hỏi nào. Thêm câu hỏi đầu tiên để bắt
                            đầu.
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
                        <div className="space-y-6">
                          {questions.map((question, index) => (
                            <Card
                              key={question.questionId}
                              className="bg-muted/40"
                            >
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="text-sm text-muted-foreground mb-1">
                                      Câu hỏi {index + 1} (
                                      {question.type ===
                                      QuestionType.MULTIPLE_CHOICE
                                        ? "Trắc nghiệm"
                                        : "Tự luận"}
                                      ) - {question.points}{" "}
                                      {question.points === 1 ? "điểm" : "điểm"}
                                    </div>
                                    <div className="font-medium">
                                      {question.text}
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {question.type ===
                                QuestionType.MULTIPLE_CHOICE ? (
                                  <div className="grid gap-2">
                                    {question.options?.map(
                                      (option: any, i: number) => (
                                        <div
                                          key={option.optionId}
                                          className={`p-2 rounded-md text-sm ${
                                            option.isCorrect
                                              ? "bg-primary-700 text-primary-50 border border-primary-600"
                                              : "bg-customgreys-secondarybg text-primary-800 border border-customgreys-darkerGrey"
                                          }`}
                                        >
                                          {option.isCorrect && (
                                            <span className="text-primary-700 font-medium mr-2">
                                              ✓
                                            </span>
                                          )}
                                          {option.text}
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-customgreys-secondarybg border border-customgreys-darkerGrey p-3 rounded-md text-sm text-primary-800">
                                    <div className="text-muted-foreground mb-1">
                                      Câu trả lời tham khảo:
                                    </div>
                                    {question.correctAnswer ||
                                      "(Không có câu trả lời tham khảo)"}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}

                          {!creatingQuestion && (
                            <div className="flex justify-center pt-4">
                              <Button
                                onClick={() => setCreatingQuestion(true)}
                                variant="outline"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm câu hỏi khác
                              </Button>
                            </div>
                          )}

                          {creatingQuestion && (
                            <Card className="border-dashed">
                              <CardHeader>
                                <CardTitle className="text-xl">
                                  Thêm câu hỏi mới
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Form {...questionForm}>
                                  <form
                                    id="question-form"
                                    onSubmit={questionForm.handleSubmit(
                                      onSubmitQuestion
                                    )}
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
                                                value={
                                                  QuestionType.MULTIPLE_CHOICE
                                                }
                                              >
                                                Trắc nghiệm
                                              </SelectItem>
                                              <SelectItem
                                                value={QuestionType.ESSAY}
                                              >
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
                                          <FormLabel>
                                            Nội dung câu hỏi
                                          </FormLabel>
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
                                            <Plus className="h-3 w-3 mr-1" />{" "}
                                            Thêm câu trả lời
                                          </Button>
                                        </div>

                                        {questionOptions?.map((_, index) => (
                                          <Option
                                            key={index}
                                            index={index}
                                            register={questionForm.register}
                                            errors={
                                              questionForm.formState.errors
                                            }
                                            setValue={questionForm.setValue}
                                            getValues={questionForm.getValues}
                                            onRemove={handleRemoveOption}
                                          />
                                        ))}
                                        <FormDescription>
                                          Đánh dấu ít nhất một câu trả lời là
                                          đúng bằng cách sử dụng công tắc
                                        </FormDescription>
                                      </div>
                                    ) : (
                                      <FormField
                                        control={questionForm.control}
                                        name="correctAnswer"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>
                                              Câu trả lời tham khảo (Tùy chọn)
                                            </FormLabel>
                                            <FormControl>
                                              <Textarea
                                                placeholder="Nhập câu trả lời tham khảo"
                                                className="min-h-[100px]"
                                                {...field}
                                              />
                                            </FormControl>
                                            <FormDescription>
                                              Đây sẽ là tài liệu tham khảo cho
                                              việc chấm điểm, nhưng sẽ không
                                              được hiển thị cho học sinh
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
                                  onClick={() => setCreatingQuestion(false)}
                                >
                                  Hủy bỏ
                                </Button>
                                <Button
                                  type="submit"
                                  form="question-form"
                                  disabled={isAddingQuestion}
                                >
                                  {isAddingQuestion && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Thêm câu hỏi
                                </Button>
                              </CardFooter>
                            </Card>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          );
        } catch (error) {
          console.error("Error rendering QuizCreator:", error);
          return (
            <Card className="p-6 border-red-200 bg-red-50">
              <CardTitle className="text-red-700 mb-4">
                Đã xảy ra lỗi khi hiển thị
              </CardTitle>
              <CardDescription>
                Không thể hiển thị biểu mẫu tạo bài kiểm tra. Vui lòng thử làm
                mới trang.
              </CardDescription>
              <div className="mt-4">
                <Button onClick={() => window.location.reload()}>
                  Làm mới trang
                </Button>
              </div>
            </Card>
          );
        }
      })()}
    </div>
  );
}
