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

// Placeholder analytics data for development/testing
export const getPlaceholderAnalytics = (
  courseId: string
): StudentProgressAnalytics => ({
  totalStudents: 25,
  averageProgress: 68,
  materialAccessData: {
    totalAccesses: 342,
    averageAccessesPerStudent: 13.7,
    studentsWithNoAccess: 2,
  },
  quizData: {
    averageScore: 78,
    studentsWithNoQuizzes: 3,
    completionRate: 85,
  },
  discussionData: {
    totalPosts: 89,
    averagePostsPerStudent: 3.6,
    participationLevels: {
      high: 7,
      medium: 9,
      low: 6,
      none: 3,
    },
  },
  studentDetails: Array(25)
    .fill(0)
    .map((_, i) => ({
      userId: `student_${i + 1}`,
      progress: Math.floor(Math.random() * 100),
      materialAccesses: Math.floor(Math.random() * 30),
      quizAverage: Math.floor(Math.random() * 100),
      participationLevel: ["High", "Medium", "Low", "None"][
        Math.floor(Math.random() * 4)
      ],
      lastAccessed: new Date(
        Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)
      ).toISOString(),
    })),
});

// API service functions
export const fetchCourseProgressAnalytics = async (
  courseId: string
): Promise<StudentProgressAnalytics> => {
  try {
    // First try to fetch from actual API
    try {
      const response = await axios.get(
        `/api/progress/analytics/course/${courseId}`
      );
      return response.data.data;
    } catch (error) {
      console.warn(
        "Using placeholder data for course analytics - API not available:",
        error
      );
      // Fall back to placeholder data if API fails
      return getPlaceholderAnalytics(courseId);
    }
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
    // Return placeholder data if API call fails
    return getPlaceholderStudentDetails(userId, courseId);
  }
};

// Placeholder student details for development/testing
export const getPlaceholderStudentDetails = (
  userId: string,
  courseId: string
): StudentProgressDetails => {
  return {
    userId,
    courseId,
    overallProgress: 68,
    enrollmentDate: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    lastAccessed: new Date().toISOString(),
    materialAccessCount: 15,
    chapters: [
      {
        chapterId: "chapter1",
        completed: true,
        accessCount: 5,
        lastAccessDate: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        chapterId: "chapter2",
        completed: true,
        accessCount: 3,
        lastAccessDate: new Date(
          Date.now() - 25 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        chapterId: "chapter3",
        completed: true,
        accessCount: 4,
        lastAccessDate: new Date(
          Date.now() - 15 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        chapterId: "chapter4",
        completed: false,
        accessCount: 2,
        lastAccessDate: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        chapterId: "chapter5",
        completed: false,
        accessCount: 1,
        lastAccessDate: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ],
    quizResults: [
      {
        quizId: "quiz1",
        score: 8,
        totalQuestions: 10,
        completionDate: new Date(
          Date.now() - 20 * 24 * 60 * 60 * 1000
        ).toISOString(),
        attemptCount: 1,
      },
      {
        quizId: "quiz2",
        score: 7,
        totalQuestions: 10,
        completionDate: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
        attemptCount: 1,
      },
    ],
    averageQuizScore: 75,
    discussionActivity: [
      {
        discussionId: "discussion1",
        postsCount: 2,
        lastActivityDate: new Date(
          Date.now() - 28 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        discussionId: "discussion2",
        postsCount: 3,
        lastActivityDate: new Date(
          Date.now() - 18 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        discussionId: "discussion3",
        postsCount: 1,
        lastActivityDate: new Date(
          Date.now() - 8 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ],
    participationLevel: "Medium",
  };
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
