import axios from "axios";

// Define types for the API responses
export interface StudentProgressAnalytics {
  totalStudents: number;
  averageProgress: number;
  materialAccessData: {
    totalAccesses: number;
    averageAccessesPerStudent: number;
    studentsWithNoAccess: number;
  };
  quizData: {
    averageScore: number;
    studentsWithNoQuizzes: number;
    completionRate: number;
  };
  discussionData: {
    totalPosts: number;
    averagePostsPerStudent: number;
    participationLevels: {
      high: number;
      medium: number;
      low: number;
      none: number;
    };
  };
  studentDetails: StudentProgressSummary[];
}

export interface StudentProgressSummary {
  userId: string;
  progress: number;
  materialAccesses: number;
  quizAverage: number;
  participationLevel: string;
  lastAccessed: string;
}

export interface StudentProgressDetails {
  userId: string;
  courseId: string;
  overallProgress: number;
  enrollmentDate: string;
  lastAccessed: string;
  materialAccessCount: number;
  chapters: {
    chapterId: string;
    completed: boolean;
    accessCount: number;
    lastAccessDate?: string;
  }[];
  quizResults: {
    quizId: string;
    score: number;
    totalQuestions: number;
    completionDate: string;
    attemptCount: number;
  }[];
  averageQuizScore: number;
  discussionActivity: {
    discussionId: string;
    postsCount: number;
    lastActivityDate: string;
  }[];
  participationLevel: string;
}

export interface QuizResultSummary {
  quizId: string;
  score: number;
  totalQuestions: number;
  completionDate: string;
  attemptCount: number;
  courseId: string;
}

export interface ProgressSummary {
  enrolledCourses: number;
  completedQuizzes: number;
  achievements: number;
  courseProgress: CourseProgressItem[];
}

export interface CourseProgressItem {
  courseId: string;
  title: string;
  enrollmentDate: string;
  progress: number;
}

// New interface for enrolled students data
export interface EnrolledStudent {
  userId: string;
  fullName: string;
  email: string;
  enrollmentDate: string;
  overallProgress: number;
  lastAccessedTimestamp: string;
  completedChapters: number;
  totalChapters: number;
  quizResults: {
    quizId: string;
    score: number;
    totalQuestions: number;
    completionDate: string;
    attemptCount: number;
  }[];
  averageQuizScore: number;
}

// New interfaces for all students progress
export interface StudentCourseProgress {
  courseId: string;
  courseTitle: string;
  enrollmentDate: string;
  progress: number;
  completedChapters: number;
  totalChapters: number;
  lastAccessed: string;
  averageQuizScore: number;
}

export interface StudentWithProgress {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  courses: StudentCourseProgress[];
  totalCourses: number;
  averageProgress: number;
  lastActivity: string;
}

export interface TeacherCourseInfo {
  courseId: string;
  title: string;
  totalStudents: number;
}

export interface AllStudentsProgressResponse {
  courses: TeacherCourseInfo[];
  students: StudentWithProgress[];
}

// API service functions
export const fetchCourseProgressAnalytics = async (
  courseId: string
): Promise<StudentProgressAnalytics> => {
  try {
    const response = await axios.get(
      `/api/progress/analytics/course/${courseId}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching course progress analytics:", error);
    throw error;
  }
};

export const fetchStudentProgressDetails = async (
  courseId: string,
  userId: string
): Promise<StudentProgressDetails> => {
  try {
    const response = await axios.get(
      `/api/progress/analytics/course/${courseId}/student/${userId}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching student progress details:", error);
    throw error;
  }
};

export const trackMaterialAccess = async (
  userId: string,
  courseId: string,
  chapterId: string
): Promise<{ accessCount: number }> => {
  try {
    const response = await axios.post("/api/progress/track/material-access", {
      userId,
      courseId,
      chapterId,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error tracking material access:", error);
    throw error;
  }
};

export const trackQuizResult = async (
  userId: string,
  courseId: string,
  quizId: string,
  score: number,
  totalQuestions: number
): Promise<{ averageScore: number; quizResults: any[] }> => {
  try {
    const response = await axios.post("/api/progress/track/quiz-result", {
      userId,
      courseId,
      quizId,
      score,
      totalQuestions,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error tracking quiz result:", error);
    throw error;
  }
};

export const trackDiscussionActivity = async (
  userId: string,
  courseId: string,
  discussionId: string
): Promise<{ participationLevel: string; totalPosts: number }> => {
  try {
    const response = await axios.post(
      "/api/progress/track/discussion-activity",
      {
        userId,
        courseId,
        discussionId,
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error tracking discussion activity:", error);
    throw error;
  }
};

export const getUserQuizResults = async (
  userId: string
): Promise<QuizResultSummary[]> => {
  try {
    // Use the route that matches the registered server endpoint
    const url = `/api/users/course-progress/${userId}/quiz-results`;
    console.log("Fetching quiz results from URL:", url);

    const response = await axios.get(url);
    console.log("Quiz results raw response:", response.data);

    // If the response is completely empty or null
    if (!response.data) {
      console.log("Empty response from quiz results API");
      return [];
    }

    // If response has the expected structure with data property containing array
    if (response.data.data && Array.isArray(response.data.data)) {
      console.log(`Found ${response.data.data.length} quiz results`);
      return response.data.data;
    }

    // If data is directly an array (fallback for unexpected structure)
    if (Array.isArray(response.data)) {
      console.log("Response data is directly an array, using it");
      return response.data;
    }

    // If data exists but is an empty object
    if (
      typeof response.data === "object" &&
      Object.keys(response.data).length === 0
    ) {
      console.log("Response data is an empty object, returning empty array");
      return [];
    }

    // If data exists but not in expected format
    console.error("Unexpected response format:", response.data);
    return [];
  } catch (error) {
    console.error("Error getting user quiz results:", error);
    return [];
  }
};

// New interface for student quiz results
export interface StudentQuizResult extends QuizResultSummary {
  userId: string;
  studentName?: string;
}

// Get all quiz results for a course (teacher view)
export const getCourseQuizResults = async (
  courseId: string
): Promise<{
  allResults: StudentQuizResult[];
  byQuiz: { [quizId: string]: StudentQuizResult[] };
}> => {
  try {
    const response = await axios.get(
      `/api/progress/analytics/course/${courseId}/quiz-results`
    );

    if (!response.data || !response.data.data) {
      return { allResults: [], byQuiz: {} };
    }

    return response.data.data;
  } catch (error) {
    console.error("Error getting course quiz results:", error);
    return { allResults: [], byQuiz: {} };
  }
};

export const getUserProgressSummary = async (
  userId: string
): Promise<ProgressSummary> => {
  try {
    const response = await axios.get(`/api/progress/${userId}/summary`);
    return response.data.data;
  } catch (error) {
    console.error("Error getting user progress summary:", error);
    return {
      enrolledCourses: 0,
      completedQuizzes: 0,
      achievements: 0,
      courseProgress: [],
    };
  }
};

// New function to get all enrolled students for a course
export const fetchEnrolledStudents = async (
  courseId: string,
  teacherId: string
): Promise<EnrolledStudent[]> => {
  try {
    const response = await axios.get(
      `/api/progress/analytics/course/${courseId}/enrolled-students?teacherId=${teacherId}`
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    return [];
  }
};

// New function to get all students progress across all courses
export const fetchAllStudentsProgress = async (
  teacherId: string
): Promise<AllStudentsProgressResponse> => {
  try {
    const response = await axios.get(
      `/api/progress/analytics/all-students?teacherId=${teacherId}`
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return { courses: [], students: [] };
  } catch (error) {
    console.error("Error fetching all students progress:", error);
    return { courses: [], students: [] };
  }
};
