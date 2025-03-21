export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  ESSAY = "essay",
}

export enum QuizScope {
  CHAPTER = "chapter",
  SECTION = "section",
  COURSE = "course",
}

export interface QuizOption {
  optionId: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  questionId: string;
  type: QuestionType;
  text: string;
  options?: QuizOption[];
  correctAnswer?: string;
  points: number;
}

export interface Quiz {
  quizId: string;
  title: string;
  description?: string;
  scope: QuizScope;
  courseId: string;
  sectionId?: string;
  chapterId?: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
