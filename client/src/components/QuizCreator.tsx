"use client";

import { useState } from "react";
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

  const onSubmitQuiz = async (data: QuizFormValues) => {
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
      setActiveTab("questions");
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Không thể tạo bài kiểm tra. Vui lòng thử lại.");
    }
  };

  const onSubmitQuestion = async (data: QuestionFormValues) => {
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

      setQuestions([...questions, result]);
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

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic" disabled={isCreatingQuiz}>
            Thông tin cơ bản
          </TabsTrigger>
          <TabsTrigger
            value="questions"
            disabled={!quizCreated || isCreatingQuiz}
          >
            Câu hỏi
          </TabsTrigger>
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
                          Chọn phạm vi bài kiểm tra là toàn khóa học, một chương
                          hoặc một bài học
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
                              {sections.map((section) => (
                                <SelectItem
                                  key={section.sectionId}
                                  value={section.sectionId}
                                >
                                  {section.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}

                  {selectedScope === QuizScope.CHAPTER && selectedSection ? (
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
                              {sections
                                .find((s) => s.sectionId === selectedSection)
                                ?.chapters.map((chapter) => (
                                  <SelectItem
                                    key={chapter.chapterId}
                                    value={chapter.chapterId}
                                  >
                                    {chapter.title}
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
              <Button type="submit" form="quiz-form" disabled={isCreatingQuiz}>
                {isCreatingQuiz && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Tạo bài kiểm tra
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="pt-4">
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
                    Không có câu hỏi nào. Thêm câu hỏi đầu tiên để bắt đầu.
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
                    <Card key={question.questionId} className="bg-muted/40">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">
                              Câu hỏi {index + 1} (
                              {question.type === QuestionType.MULTIPLE_CHOICE
                                ? "Trắc nghiệm"
                                : "Tự luận"}
                              ) - {question.points}{" "}
                              {question.points === 1 ? "điểm" : "điểm"}
                            </div>
                            <div className="font-medium">{question.text}</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {question.type === QuestionType.MULTIPLE_CHOICE ? (
                          <div className="grid gap-2">
                            {question.options?.map((option: any, i: number) => (
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
                                    <Plus className="h-3 w-3 mr-1" /> Thêm câu
                                    trả lời
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
                                              placeholder={`Option ${
                                                index + 1
                                              }`}
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
                                  Đánh dấu ít nhất một câu trả lời là đúng bằng
                                  cách sử dụng công tắc
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
