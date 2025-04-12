import { Clerk } from "@clerk/clerk-js";

declare global {
  interface Window {
    Clerk?: Clerk;
  }
}

interface StudentCourse {
  courseId: string;
  title: string;
  lastActivity: string;
  completedChapters: number;
  totalChapters: number;
  completionPercentage: number;
}

interface Student {
  studentId: string;
  name: string;
  email: string;
  totalCourses: number;
  courses: StudentCourse[];
  lastActivity: string;
}

interface StudentOverview {
  totalStudents: number;
  students: Student[];
}

// Course Progress Analytics Types
interface MaterialAccessData {
  totalAccesses: number;
  averageAccessesPerStudent: number;
  studentsWithNoAccess: number;
}

interface QuizData {
  averageScore: number;
  studentsWithNoQuizzes: number;
  completionRate: number;
}

interface DiscussionData {
  totalPosts: number;
  averagePostsPerStudent: number;
  participationLevels: {
    high: number;
    medium: number;
    low: number;
    none: number;
  };
}

interface StudentDetailProgress {
  userId: string;
  progress: number;
  materialAccesses: number;
  quizAverage: number;
  participationLevel: string;
  lastAccessed: string;
}

interface CourseProgressAnalytics {
  totalStudents: number;
  averageProgress: number;
  materialAccessData: MaterialAccessData;
  quizData: QuizData;
  discussionData: DiscussionData;
  studentDetails: StudentDetailProgress[];
}
