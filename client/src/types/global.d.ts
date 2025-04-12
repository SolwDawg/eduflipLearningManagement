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
