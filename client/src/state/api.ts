import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BaseQueryApi, FetchArgs } from "@reduxjs/toolkit/query";
import { User } from "@clerk/nextjs/server";
import { Clerk } from "@clerk/clerk-js";
import { toast } from "sonner";
import { Quiz } from "@/types/quiz";

// Function to handle token expiration
const handleTokenExpiration = async () => {
  toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

  // Only attempt to sign out if we're in a browser environment
  if (typeof window !== "undefined") {
    try {
      // Sign out using Clerk
      if (window.Clerk) {
        await window.Clerk.signOut();
      }

      // Redirect to sign in page
      window.location.href = "/signin";
    } catch (error) {
      console.error("Error during sign out:", error);
      // Redirect anyway in case of error
      window.location.href = "/signin";
    }
  }
};

const customBaseQuery = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: any
) => {
  // Special debug logging for course updates
  if (
    typeof args === "object" &&
    args.url &&
    args.url.includes("courses/") &&
    args.method === "PUT"
  ) {
    console.log("[API:DEBUG] Processing course update request:", {
      url: args.url,
      method: args.method,
      bodyType: args.body instanceof FormData ? "FormData" : typeof args.body,
      bodyKeys:
        args.body instanceof FormData
          ? Array.from((args.body as FormData).keys())
          : "not FormData",
    });
  }

  const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      try {
        const token = await window.Clerk?.session?.getToken();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
      } catch (error) {
        console.error("Error getting token:", error);
        // Token retrieval failed - likely expired or invalid
        handleTokenExpiration();
        return headers;
      }
    },
  });

  try {
    // More detailed logging for course update requests
    if (
      typeof args === "object" &&
      args.url &&
      args.url.includes("courses/") &&
      args.method === "PUT"
    ) {
      console.log(
        "[API:DEBUG] Sending course update request to:",
        process.env.NEXT_PUBLIC_API_BASE_URL + "/" + args.url
      );
    }

    const result: any = await baseQuery(args, api, extraOptions);

    // Check for authentication errors (401 Unauthorized or 403 Forbidden)
    if (
      result.error &&
      (result.error.status === 401 || result.error.status === 403)
    ) {
      console.log(
        "Authentication error detected - token may be expired:",
        result.error
      );
      await handleTokenExpiration();
      return result;
    }

    if (result.error) {
      // Handle error details
      const errorData = result.error.data;
      const errorMessage =
        errorData?.message ||
        (result.error.status
          ? result.error.status.toString()
          : "UNKNOWN_ERROR") ||
        "An error occurred";

      // Extract error details if available
      const errorDetails = errorData?.error
        ? typeof errorData.error === "object"
          ? JSON.stringify(errorData.error)
          : errorData.error
        : "No additional details";

      // Don't show toast for user enrolled courses endpoint when it returns empty
      const isEnrolledCoursesEndpoint =
        typeof args === "string" &&
        args.includes("/users/course-progress/") &&
        args.includes("/enrolled-courses");

      // Check if this is the courses endpoint
      const isCoursesEndpoint =
        (typeof args === "string" && args === "courses") ||
        (typeof args === "object" && args.url === "courses");

      // Check if this is a quizzes endpoint
      const isQuizzesEndpoint =
        typeof args === "string"
          ? args.includes("/quizzes/course/")
          : args.url?.includes("/quizzes/course/");

      // Check if this is a search endpoint
      const isSearchEndpoint =
        typeof args === "string"
          ? args.includes("/courses/search")
          : args.url?.includes("/courses/search");

      // Check if this is a course progress endpoint
      const isCourseProgressEndpoint =
        typeof args === "string"
          ? args.includes("/users/course-progress/") &&
            args.includes("/courses/")
          : args.url &&
            args.url.includes("/users/course-progress/") &&
            args.url.includes("/courses/");

      // Handle specific error cases differently
      // 1. Don't show errors for course progress not found (404) - this is normal for new courses
      const isCourseProgressNotFound =
        isCourseProgressEndpoint &&
        result.error.status === 404 &&
        errorMessage.includes("Course progress not found");

      // 2. Don't show errors for search with no results (404)
      const isSearchWithNoResults =
        isSearchEndpoint && result.error.status === 404;

      // Skip showing toast for certain errors
      if (
        !(isEnrolledCoursesEndpoint && result.error.status === 500) &&
        !(isCoursesEndpoint && result.error.status === 500) &&
        !(isQuizzesEndpoint && result.error.status === 500) &&
        !isCourseProgressNotFound && // Don't show toast for course progress not found
        !isSearchWithNoResults && // Don't show toast for search with no results
        result.error.status !== "PARSING_ERROR" // Skip showing toast for parsing errors
      ) {
        toast.error(`Lỗi: ${errorMessage}`);
      }

      // Log detailed error information (except for expected "not found" cases)
      if (!isCourseProgressNotFound && !isSearchWithNoResults) {
        console.error(
          `API Error (${result?.error?.status || "UNKNOWN"}):`,
          errorMessage || "Unknown message",
          errorDetails || "No details available",
          result?.error || {}
        );
      }

      // For enrolled courses endpoint, general courses endpoint, or quizzes endpoint, convert 500 error to empty array
      if (
        (isEnrolledCoursesEndpoint && result.error.status === 500) ||
        (isCoursesEndpoint && result.error.status === 500) ||
        (isQuizzesEndpoint && result.error.status === 500)
      ) {
        console.log(
          `Returning empty array for failed ${
            isQuizzesEndpoint ? "quizzes" : "courses"
          } request`
        );
        return { data: [] };
      }

      // For course progress not found, return an empty progress object
      if (isCourseProgressNotFound) {
        console.log(
          "Course progress not found, returning empty progress object"
        );
        return {
          data: {
            userId: args.toString().split("/").slice(-3)[0],
            courseId: args.toString().split("/").slice(-1)[0],
            sections: [],
            enrollmentDate: null,
            overallProgress: 0,
            lastAccessedTimestamp: null,
          },
        };
      }

      // For parsing errors, return a formatted error object
      if (result.error.status === "PARSING_ERROR") {
        console.log("Handling parsing error with empty result");
        return { data: null, error: result.error };
      }

      // Handle specific error handling for quiz-related endpoints
      const isQuizEndpoint =
        typeof args === "string"
          ? args.includes("/quizzes/")
          : args.url?.includes("/quizzes/");

      // Special handling for quiz endpoints to prevent client crashes
      if (isQuizEndpoint && result.error) {
        console.error(
          `Quiz API error (${result?.error?.status || "UNKNOWN"}):`,
          result.error
        );

        // For quiz endpoints, if we get a 404 or 500, return a safe default object
        if (result.error.status === 404 || result.error.status === 500) {
          if (
            typeof args === "string" &&
            args.includes("/quizzes/") &&
            !args.includes("/course/")
          ) {
            // Single quiz endpoint - return a safe empty quiz
            console.log(
              "Returning safe empty quiz object for failed quiz request"
            );
            return {
              data: {
                quizId: "error",
                title: "Quiz không tồn tại",
                description: "Không thể tải dữ liệu bài kiểm tra",
                questions: [],
                timeLimit: null,
              },
            };
          } else if (
            typeof args === "object" &&
            args.url &&
            args.url.includes("/quizzes/") &&
            !args.url.includes("/course/")
          ) {
            // Single quiz endpoint - return a safe empty quiz
            console.log(
              "Returning safe empty quiz object for failed quiz request"
            );
            return {
              data: {
                quizId: "error",
                title: "Quiz không tồn tại",
                description: "Không thể tải dữ liệu bài kiểm tra",
                questions: [],
                timeLimit: null,
              },
            };
          }
        }
      }

      return result;
    }

    const isMutationRequest =
      (args as FetchArgs).method && (args as FetchArgs).method !== "GET";

    if (isMutationRequest) {
      const successMessage = result.data?.message;
      if (successMessage) toast.success(successMessage);
    }

    // Handle different response formats
    if (result.data !== undefined) {
      // If data.data exists, use it (common API wrapper pattern)
      if (result.data.data !== undefined) {
        result.data = result.data.data;
      }
      // Otherwise, keep the original data
      return result;
    } else if (
      result.error?.status === 204 ||
      result.meta?.response?.status === 204
    ) {
      return { data: null };
    }

    // Ensure we always return a valid result or error
    return result.data !== undefined
      ? { data: result.data }
      : { error: { status: "CUSTOM_ERROR", data: "Invalid response format" } };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("API Request Failed:", errorMessage);

    // Check if the error is related to authentication
    if (
      error instanceof Error &&
      (errorMessage.toLowerCase().includes("authentication") ||
        errorMessage.toLowerCase().includes("token") ||
        errorMessage.toLowerCase().includes("unauthorized"))
    ) {
      handleTokenExpiration();
    }

    return { error: { status: "FETCH_ERROR", error: errorMessage } };
  }
};

export const api = createApi({
  baseQuery: customBaseQuery,
  reducerPath: "adminApi",
  tagTypes: [
    "Auth",
    "Courses",
    "Course",
    "Lectures",
    "Lecture",
    "Grade",
    "Grades",
    "Enrollments",
    "Users",
    "Progress",
    "UserCourseProgress",
    "Discussions",
    "Discussion",
    "Comments",
    "Quizzes",
    "Quiz",
    "CourseProgress",
    "EnrolledCourses",
    "QuizAttempt",
    "Leaderboard",
    "HomepageImages",
    "UserCourses",
    "StudyBuddies",
    "ChatMessages",
    "Conversations",
    "StudentsOverview",
    "StudentProgress",
  ],
  keepUnusedDataFor: 300, // Keep unused data for 5 minutes (300 seconds)
  endpoints: (build) => ({
    /* 
    ===============
    USER CLERK
    =============== 
    */
    updateUser: build.mutation<User, Partial<User> & { userId: string }>({
      query: ({ userId, ...updatedUser }) => ({
        url: `users/clerk/${userId}`,
        method: "PUT",
        body: updatedUser,
      }),
      invalidatesTags: ["Users"],
    }),

    /* 
    ===============
    COURSES
    =============== 
    */
    getCourses: build.query<Course[], void>({
      query: () => ({
        url: "courses",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ courseId }) => ({
                type: "Courses" as const,
                id: courseId,
              })),
              { type: "Courses", id: "LIST" },
            ]
          : [{ type: "Courses", id: "LIST" }],
      keepUnusedDataFor: 600, // 10 minutes (600 seconds)
    }),

    getCourse: build.query<Course, string>({
      query: (id) => `courses/${id}`,
      providesTags: (result, error, id) => [
        { type: "Course", id },
        { type: "Courses", id },
      ],
      keepUnusedDataFor: 300, // 5 minutes
      transformResponse: (response: Course) => {
        return response;
      },
    }),

    createCourse: build.mutation<
      Course,
      { teacherId: string; teacherName: string }
    >({
      query: (body) => ({
        url: `courses`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Courses"],
    }),

    updateCourse: build.mutation<
      Course,
      { courseId: string; formData: FormData }
    >({
      query: ({ courseId, formData }) => {
        console.log(
          `[updateCourseMutation] Starting course update for ID: ${courseId}`
        );

        // Create an AbortController with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.error(
            "[updateCourseMutation] Request timed out after 30 seconds"
          );
          controller.abort();
        }, 30000);

        return {
          url: `courses/${courseId}`,
          method: "PUT",
          body: formData,
          // Important: do NOT let RTK Query process the FormData
          formData: true,
          // We'll use content-type: multipart/form-data and let the browser handle it
          // No prepareHeaders needed
          signal: controller.signal,
          validateStatus: (response, result) => {
            // Clear the timeout if we get any response
            clearTimeout(timeoutId);

            console.log("[updateCourseMutation] Received response:", {
              status: response.status,
              ok: response.ok,
              statusText: response.statusText,
            });

            return response.ok;
          },
        };
      },
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Courses", id: courseId },
      ],
    }),

    deleteCourse: build.mutation<{ message: string }, string>({
      query: (courseId) => ({
        url: `courses/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Courses"],
    }),

    getUploadVideoUrl: build.mutation<
      { uploadUrl: string; videoUrl: string },
      {
        courseId: string;
        chapterId: string;
        sectionId: string;
        fileName: string;
        fileType: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, fileName, fileType }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/get-upload-url`,
        method: "POST",
        body: { fileName, fileType },
      }),
    }),

    getUploadPresentationUrl: build.mutation<
      { uploadUrl: string; presentationUrl: string },
      {
        courseId: string;
        chapterId: string;
        sectionId: string;
        fileName: string;
        fileType: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, fileName, fileType }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/get-ppt-upload-url`,
        method: "POST",
        body: { fileName, fileType },
      }),
    }),

    getUploadDocumentUrl: build.mutation<
      { uploadUrl: string; documentUrl: string },
      {
        courseId: string;
        chapterId: string;
        sectionId: string;
        fileName: string;
        fileType: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, fileName, fileType }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/get-document-upload-url`,
        method: "POST",
        body: { fileName, fileType },
      }),
    }),

    getUploadImageUrl: build.mutation<
      { uploadUrl: string; imageUrl: string },
      {
        courseId: string;
        fileName: string;
        fileType: string;
      }
    >({
      query: ({ courseId, fileName, fileType }) => ({
        url: `courses/${courseId}/get-upload-image-url`,
        method: "POST",
        body: { fileName, fileType },
      }),
    }),

    /* 
    ===============
    USER COURSE PROGRESS
    =============== 
    */
    getUserEnrolledCourses: build.query<Course[], string>({
      query: (userId) => ({
        url: `users/course-progress/${userId}/enrolled-courses`,
        method: "GET",
      }),
      providesTags: (result, error, userId) => [
        { type: "EnrolledCourses", id: userId },
      ],
    }),

    enrollCourse: build.mutation<
      UserCourseProgress,
      { userId: string; courseId: string }
    >({
      query: ({ userId, courseId }) => ({
        url: `users/course-progress/${userId}/courses/${courseId}/enroll`,
        method: "POST",
      }),
      invalidatesTags: ["UserCourseProgress", "Courses"],
    }),

    getUserCourseProgress: build.query<
      any,
      { userId: string; courseId: string }
    >({
      query: ({ userId, courseId }) => ({
        url: `users/course-progress/${userId}/courses/${courseId}`,
        method: "GET",
      }),
      providesTags: (result, error, { userId, courseId }) => [
        { type: "UserCourseProgress", id: `${userId}-${courseId}` },
      ],
    }),

    updateUserCourseProgress: build.mutation<
      any,
      {
        userId: string;
        courseId: string;
        progressData: {
          sections: any[];
        };
      }
    >({
      query: ({ userId, courseId, progressData }) => ({
        url: `users/course-progress/${userId}/courses/${courseId}`,
        method: "PUT",
        body: progressData,
      }),
      invalidatesTags: (result, error, { userId, courseId }) => [
        { type: "UserCourseProgress", id: `${userId}-${courseId}` },
      ],
    }),

    getUserQuizResults: build.query<any, string>({
      query: (userId) => `users/course-progress/${userId}/quiz-results`,
      providesTags: (result, error, userId) => [
        { type: "QuizAttempt", id: userId },
      ],
    }),

    getUserProgressSummary: build.query<any, string>({
      query: (userId) => `api/progress/${userId}/summary`,
      providesTags: (result, error, userId) => [
        { type: "UserCourseProgress", id: userId },
      ],
    }),

    getUserDashboard: build.query<
      {
        message: string;
        data: {
          enrolledCourses: Array<{
            courseId: string;
            title: string;
            image: string;
            teacherName: string;
            level: string;
            enrollmentDate: string;
            lastAccessedTimestamp: string | null;
            overallProgress: number;
            totalChapters: number;
            completedChapters: number;
          }>;
          quizResults: Array<{
            quizId: string;
            quizTitle: string;
            sectionTitle: string;
            courseId: string;
            courseTitle: string;
            score: number;
            passingScore: number;
            passed: boolean;
            completedAt: string;
            timeSpent: number;
          }>;
          overallStats: {
            totalCourses: number;
            coursesInProgress: number;
            coursesCompleted: number;
            averageScore: number;
          };
        };
      },
      string
    >({
      query: (userId) => `api/progress/${userId}/dashboard`,
      providesTags: (result, error, userId) => [
        { type: "UserCourseProgress", id: userId },
      ],
      // Add error handling to prevent parsing errors
      transformErrorResponse: (response) => {
        console.log("Dashboard API error:", response);

        // Return empty data structure on error to prevent UI crashes
        return {
          data: {
            message: "Failed to fetch dashboard data",
            data: {
              enrolledCourses: [],
              quizResults: [],
              overallStats: {
                totalCourses: 0,
                coursesInProgress: 0,
                coursesCompleted: 0,
                averageScore: 0,
              },
            },
          },
        };
      },
    }),

    getMonthlyLeaderboard: build.query<any, void>({
      query: () => "users/course-progress/leaderboard/monthly",
      providesTags: ["Leaderboard"],
    }),

    getPublicMonthlyLeaderboard: build.query<any, void>({
      query: () => "api/public/leaderboard/monthly",
      providesTags: ["Leaderboard"],
    }),

    /* 
    ===============
    GRADES
    =============== 
    */
    getGrades: build.query<Grade[], void>({
      query: () => `api/grades`,
      providesTags: ["Grades"],
      transformResponse: (response: any) => {
        if (!response) return [];
        return response;
      },
      transformErrorResponse: (response: { status: string | number }) => {
        if (response.status === 404) {
          console.log("No grades found, returning empty array");
          return { data: [] };
        }
        return response;
      },
    }),

    getGrade: build.query<Grade, string>({
      query: (gradeId) => `grades/${gradeId}`,
      providesTags: (result, error, id) => [{ type: "Grades", id }],
    }),

    createGrade: build.mutation<Grade, Partial<Grade>>({
      query: (gradeData) => ({
        url: `grades`,
        method: "POST",
        body: gradeData,
      }),
      invalidatesTags: ["Grades"],
    }),

    updateGrade: build.mutation<
      Grade,
      { gradeId: string; gradeData: Partial<Grade> }
    >({
      query: ({ gradeId, gradeData }) => ({
        url: `grades/${gradeId}`,
        method: "PUT",
        body: gradeData,
      }),
      invalidatesTags: (result, error, { gradeId }) => [
        { type: "Grades", id: gradeId },
        "Grades",
      ],
    }),

    deleteGrade: build.mutation<{ message: string }, string>({
      query: (gradeId) => ({
        url: `grades/${gradeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Grades"],
    }),

    getGradeCourses: build.query<Course[], string>({
      query: (gradeId) => `grades/${gradeId}/courses`,
      providesTags: (result, error, id) => [{ type: "Grades", id }, "Courses"],
    }),

    addCourseToGrade: build.mutation<
      { message: string },
      { gradeId: string; courseId: string }
    >({
      query: ({ gradeId, courseId }) => ({
        url: `grades/${gradeId}/courses`,
        method: "POST",
        body: { courseId },
      }),
      invalidatesTags: (result, error, { gradeId }) => [
        { type: "Grades", id: gradeId },
        "Courses",
      ],
    }),

    removeCourseFromGrade: build.mutation<
      { message: string },
      { gradeId: string; courseId: string }
    >({
      query: ({ gradeId, courseId }) => ({
        url: `grades/${gradeId}/courses/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { gradeId }) => [
        { type: "Grades", id: gradeId },
        "Courses",
      ],
    }),

    /* 
    ===============
    COMMENTS
    =============== 
    */
    getChapterComments: build.query<
      { commentId: string; userId: string; text: string; timestamp: string }[],
      { courseId: string; sectionId: string; chapterId: string }
    >({
      query: ({ courseId, sectionId, chapterId }) =>
        `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments`,
      providesTags: (result, error, { chapterId }) => [
        { type: "Comments", id: chapterId },
      ],
    }),

    addChapterComment: build.mutation<
      { commentId: string; userId: string; text: string; timestamp: string },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        text: string;
        imageUrl?: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, ...comment }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments`,
        method: "POST",
        body: comment,
      }),
      invalidatesTags: (result, error, { chapterId }) => [
        { type: "Comments", id: chapterId },
      ],
    }),

    deleteChapterComment: build.mutation<
      { message: string },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        commentId: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, commentId }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { chapterId }) => [
        { type: "Comments", id: chapterId },
      ],
    }),

    /* 
    ===============
    QUIZZES
    =============== 
    */
    getQuizzes: build.query<Quiz[], { courseId: string }>({
      query: ({ courseId }) => `quizzes/course/${courseId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ quizId }) => ({
                type: "Quizzes" as const,
                id: quizId,
              })),
              { type: "Quizzes", id: "LIST" },
            ]
          : [{ type: "Quizzes", id: "LIST" }],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    getQuiz: build.query<Quiz, string>({
      query: (quizId) => `quizzes/${quizId}`,
      providesTags: (result, error, id) => [{ type: "Quizzes", id }],
    }),

    createQuiz: build.mutation<
      Quiz,
      {
        title: string;
        description?: string;
        scope: string;
        courseId: string;
        sectionId?: string;
        chapterId?: string;
        timeLimit?: number;
      }
    >({
      query: (body) => {
        // Ensure we send clean data without null values
        const cleanedBody = Object.fromEntries(
          Object.entries(body).filter(([_, v]) => v !== null)
        );

        return {
          url: "quizzes",
          method: "POST",
          body: cleanedBody,
        };
      },
      invalidatesTags: ["Quizzes"],
    }),

    updateQuiz: build.mutation<
      Quiz,
      {
        quizId: string;
        title?: string;
        description?: string;
        scope?: string;
        sectionId?: string | null;
        chapterId?: string | null;
        timeLimit?: number | null;
        isPublished?: boolean;
      }
    >({
      query: ({ quizId, ...body }) => {
        // Convert null values to undefined to avoid sending them to the server
        const cleanedBody = Object.fromEntries(
          Object.entries(body).filter(([_, v]) => v !== null)
        );

        return {
          url: `quizzes/${quizId}`,
          method: "PUT",
          body: cleanedBody,
        };
      },
      invalidatesTags: (result, error, { quizId }) => [
        { type: "Quizzes", id: quizId },
      ],
    }),

    deleteQuiz: build.mutation<{ message: string }, string>({
      query: (quizId) => ({
        url: `quizzes/${quizId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quizzes"],
    }),

    addQuizQuestion: build.mutation<
      {
        questionId: string;
        type: string;
        text: string;
        options?: Array<{ optionId: string; text: string; isCorrect: boolean }>;
        correctAnswer?: string;
        points?: number;
      },
      {
        quizId: string;
        type: string;
        text: string;
        options?: Array<{ text: string; isCorrect: boolean }>;
        correctAnswer?: string;
        points?: number;
      }
    >({
      query: ({ quizId, ...body }) => ({
        url: `quizzes/${quizId}/questions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { quizId }) => [
        { type: "Quizzes", id: quizId },
      ],
    }),

    updateQuizQuestion: build.mutation<
      {
        questionId: string;
        type: string;
        text: string;
        options?: Array<{ optionId: string; text: string; isCorrect: boolean }>;
        correctAnswer?: string;
        points?: number;
      },
      {
        quizId: string;
        questionId: string;
        type?: string;
        text?: string;
        options?: Array<{
          optionId?: string;
          text: string;
          isCorrect: boolean;
        }>;
        correctAnswer?: string;
        points?: number;
      }
    >({
      query: ({ quizId, questionId, ...body }) => ({
        url: `quizzes/${quizId}/questions/${questionId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { quizId }) => [
        { type: "Quizzes", id: quizId },
      ],
    }),

    deleteQuizQuestion: build.mutation<
      { message: string },
      { quizId: string; questionId: string }
    >({
      query: ({ quizId, questionId }) => ({
        url: `quizzes/${quizId}/questions/${questionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { quizId }) => [
        { type: "Quizzes", id: quizId },
      ],
    }),

    // Homepage Images endpoints
    getHomepageImages: build.query({
      query: () => `api/homepage-images`,
      providesTags: ["HomepageImages"],
    }),

    getHomepageImageById: build.query({
      query: (imageId) => `api/homepage-images/${imageId}`,
      providesTags: (result, error, imageId) => [
        { type: "HomepageImages", id: imageId },
      ],
    }),

    getUploadUrls: build.mutation({
      query: (files) => ({
        url: `api/homepage-images/upload-urls`,
        method: "POST",
        body: { files },
      }),
    }),

    addHomepageImages: build.mutation({
      query: (imageUrls) => ({
        url: `api/homepage-images`,
        method: "POST",
        body: { imageUrls },
      }),
      invalidatesTags: ["HomepageImages"],
    }),

    updateHomepageImage: build.mutation({
      query: ({ imageId, imageUrl }) => ({
        url: `api/homepage-images/${imageId}`,
        method: "PUT",
        body: { imageUrl },
      }),
      invalidatesTags: (result, error, { imageId }) => [
        { type: "HomepageImages", id: imageId },
        "HomepageImages",
      ],
    }),

    deleteHomepageImage: build.mutation({
      query: (imageId) => ({
        url: `api/homepage-images/${imageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["HomepageImages"],
    }),

    searchCourses: build.query({
      query: (searchTerm) => ({
        url: `courses/search?query=${encodeURIComponent(searchTerm)}`,
        method: "GET",
      }),
    }),

    /* 
    ===============
    CHAT
    =============== 
    */
    getUserConversations: build.query<any, void>({
      query: () => ({
        url: "chats/conversations",
        method: "GET",
      }),
      providesTags: ["Conversations"],
    }),

    getConversationMessages: build.query<
      any,
      { courseId: string; userId: string }
    >({
      query: ({ courseId, userId }) => ({
        url: `chats/conversations/${courseId}/${userId}`,
        method: "GET",
      }),
      providesTags: (result, error, { courseId, userId }) => [
        { type: "ChatMessages", id: `${courseId}-${userId}` },
      ],
    }),

    sendChatMessage: build.mutation<
      any,
      {
        courseId: string;
        recipientId: string;
        content: string;
        attachments?: string[];
      }
    >({
      query: (body) => ({
        url: "chats/messages",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { courseId, recipientId }) => [
        { type: "ChatMessages", id: `${courseId}-${recipientId}` },
        "Conversations",
      ],
    }),

    markMessageAsRead: build.mutation<any, string>({
      query: (messageId) => ({
        url: `chats/messages/${messageId}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["ChatMessages", "Conversations"],
    }),

    /* 
    ===============
    TEACHER
    =============== 
    */
    getTeacherCourses: build.query<any[], void>({
      query: () => ({
        url: "/api/teachers/courses",
        method: "GET",
      }),
      providesTags: ["Courses", "UserCourses"],
      keepUnusedDataFor: 300, // 5 minutes
      transformErrorResponse: (response: {
        status: string | number;
        data?: any;
      }) => {
        console.log("Teacher courses API error:", response);

        if (response.status === 404 || response.status === 500) {
          console.error(`${response.status} error in teacher courses API`);
          return [];
        }

        return response;
      },
    }),

    getStudentsOverview: build.query<
      {
        message: string;
        data: {
          totalStudents: number;
          students: Array<{
            studentId: string;
            name: string;
            email: string;
            totalCourses: number;
            courses: Array<{
              courseId: string;
              title: string;
              lastActivity: string;
              completedChapters: number;
              totalChapters: number;
              completionPercentage: number;
              quizResults: Array<{
                quizId: string;
                score: number;
                totalQuestions: number;
                completionDate: string;
                attemptCount: number;
                quizTitle?: string;
              }>;
              totalQuizzesTaken: number;
              averageQuizScore: number;
            }>;
            lastActivity: string;
            quizResults: Array<{
              quizId: string;
              score: number;
              totalQuestions: number;
              completionDate: string;
              attemptCount: number;
              quizTitle?: string;
            }>;
            totalQuizzesTaken: number;
            averageQuizScore: number;
          }>;
        };
      },
      void
    >({
      query: () => ({
        url: "/api/teachers/students-overview",
        method: "GET",
      }),
      providesTags: ["StudentsOverview"],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    getCourseProgressAnalytics: build.query<
      {
        message: string;
        data: {
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
          studentDetails: Array<{
            userId: string;
            progress: number;
            materialAccesses: number;
            quizAverage: number;
            participationLevel: string;
            lastAccessed: string;
          }>;
        };
      },
      string
    >({
      query: (courseId) => ({
        url: `/api/progress/analytics/course/${courseId}`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "CourseProgress", id: courseId },
      ],
      keepUnusedDataFor: 300, // 5 minutes
      transformErrorResponse: (response: {
        status: string | number;
        data?: any;
      }) => {
        console.log("Course analytics API error:", response);

        if (response.status === 500) {
          console.error("500 Server error in course analytics API");
          return {
            message:
              "Không thể truy xuất dữ liệu tiến độ học tập của học sinh. Lỗi máy chủ đã xảy ra.",
            data: {
              totalStudents: 0,
              averageProgress: 0,
              materialAccessData: {
                totalAccesses: 0,
                averageAccessesPerStudent: 0,
                studentsWithNoAccess: 0,
              },
              quizData: {
                averageScore: 0,
                studentsWithNoQuizzes: 0,
                completionRate: 0,
              },
              discussionData: {
                totalPosts: 0,
                averagePostsPerStudent: 0,
                participationLevels: {
                  high: 0,
                  medium: 0,
                  low: 0,
                  none: 0,
                },
              },
              studentDetails: [],
            },
          };
        } else if (response.status === 404) {
          console.error("404 Not found error in course analytics API");
          return {
            message:
              "Không tìm thấy dữ liệu phân tích. Khóa học có thể không tồn tại hoặc không có học sinh đã đăng ký.",
            data: {
              totalStudents: 0,
              averageProgress: 0,
              materialAccessData: {
                totalAccesses: 0,
                averageAccessesPerStudent: 0,
                studentsWithNoAccess: 0,
              },
              quizData: {
                averageScore: 0,
                studentsWithNoQuizzes: 0,
                completionRate: 0,
              },
              discussionData: {
                totalPosts: 0,
                averagePostsPerStudent: 0,
                participationLevels: {
                  high: 0,
                  medium: 0,
                  low: 0,
                  none: 0,
                },
              },
              studentDetails: [],
            },
          };
        }

        // Handle any other error type
        return {
          message: response.data?.message || "Không thể tải dữ liệu phân tích",
          data: {
            totalStudents: 0,
            averageProgress: 0,
            materialAccessData: {
              totalAccesses: 0,
              averageAccessesPerStudent: 0,
              studentsWithNoAccess: 0,
            },
            quizData: {
              averageScore: 0,
              studentsWithNoQuizzes: 0,
              completionRate: 0,
            },
            discussionData: {
              totalPosts: 0,
              averagePostsPerStudent: 0,
              participationLevels: {
                high: 0,
                medium: 0,
                low: 0,
                none: 0,
              },
            },
            studentDetails: [],
          },
        };
      },
    }),

    // Add the new endpoint for student progress details
    getStudentProgressDetails: build.query({
      query: ({ courseId, userId }) => ({
        url: `/api/progress/analytics/course/${courseId}/student/${userId}`,
        method: "GET",
      }),
      providesTags: ["StudentProgress"],
    }),

    getUser: build.query({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),

    getCourseProgress: build.query({
      query: (courseId) => `/api/progress/analytics/course/${courseId}`,
    }),

    getCourseQuizResults: build.query({
      query: (courseId) =>
        `/api/progress/analytics/course/${courseId}/quiz-results`,
    }),

    getStudentQuizResults: build.query({
      query: ({ courseId, userId }) =>
        `/api/progress/analytics/course/${courseId}/student/${userId}/quiz-results`,
    }),

    getEnrolledStudentsWithProgress: build.query({
      query: (courseId) =>
        `/api/progress/analytics/course/${courseId}/enrolled-students`,
    }),

    getAllStudentsProgress: build.query({
      query: () => `/api/progress/analytics/all-students`,
    }),

    // Get analytics for all teacher courses in a single endpoint
    getAllTeacherCoursesWithAnalytics: build.query<any, void>({
      async queryFn(_arg, { dispatch, getState }, _extraOptions, fetchWithBQ) {
        try {
          // Step 1: Fetch all teacher courses
          const courseResponse = await fetchWithBQ("/api/teachers/courses");

          if (courseResponse.error) {
            console.error(
              "Error fetching teacher courses:",
              courseResponse.error
            );
            return { data: [] };
          }

          const courses = courseResponse.data as any[];
          if (!courses || courses.length === 0) {
            return { data: [] };
          }

          // Step 2: For each course, fetch its analytics
          const coursesWithAnalytics = await Promise.all(
            courses.map(async (course) => {
              const courseId = course.courseId || course.id;

              try {
                // Fetch analytics for this course
                const analyticsResponse = await fetchWithBQ(
                  `/api/progress/analytics/course/${courseId}`
                );

                if (analyticsResponse.error) {
                  console.warn(
                    `Could not fetch analytics for course ${courseId}:`,
                    analyticsResponse.error
                  );
                  return {
                    ...course,
                    analytics: null,
                    studentCount: 0,
                    averageProgress: 0,
                    completionRate: 0,
                    materialAccessCount: 0,
                    quizAverage: 0,
                    discussionPostCount: 0,
                  };
                }

                const analytics = analyticsResponse.data.data;

                return {
                  ...course,
                  analytics,
                  studentCount: analytics.totalStudents || 0,
                  averageProgress: analytics.averageProgress || 0,
                  completionRate: analytics.quizData?.completionRate || 0,
                  materialAccessCount:
                    analytics.materialAccessData?.totalAccesses || 0,
                  quizAverage: analytics.quizData?.averageScore || 0,
                  discussionPostCount:
                    analytics.discussionData?.totalPosts || 0,
                };
              } catch (error) {
                console.error(
                  `Error processing analytics for course ${courseId}:`,
                  error
                );
                return {
                  ...course,
                  analytics: null,
                  studentCount: 0,
                  averageProgress: 0,
                  completionRate: 0,
                  materialAccessCount: 0,
                  quizAverage: 0,
                  discussionPostCount: 0,
                };
              }
            })
          );

          return { data: coursesWithAnalytics };
        } catch (error) {
          console.error("Error in getAllTeacherCoursesWithAnalytics:", error);
          return { error: { status: 500, data: error } };
        }
      },
      providesTags: ["Courses", "CourseProgress"],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    /* 
    ===============
    TEACHER ENDPOINTS
    =============== 
    */
    getCourseEnrollmentCount: build.query<
      { courseId: string; title: string; enrollmentCount: number },
      string
    >({
      query: (courseId) => ({
        url: `/api/teachers/course/${courseId}/enrollment-count`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "Enrollments", id: courseId },
      ],
    }),

    getCourseEnrollmentDetails: build.query<
      {
        courseId: string;
        title: string;
        enrollmentCount: number;
        enrolledStudents: Array<{
          userId: string;
          fullName: string;
          email: string;
          enrollmentDate: string;
          overallProgress: number;
          lastAccessDate: string;
        }>;
      },
      string
    >({
      query: (courseId) => ({
        url: `/api/teachers/course/${courseId}/enrollment-details`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "Enrollments", id: courseId },
      ],
    }),

    // Quiz completion tracking endpoints
    getCourseQuizCompletionCount: build.query<
      {
        courseId: string;
        title: string;
        enrollmentCount: number;
        quizCompletionCount: number;
        completionRate: number;
        quizData: Array<{
          quizId: string;
          title: string;
          completedCount: number;
          averageScore: number;
        }>;
      },
      string
    >({
      query: (courseId) => ({
        url: `api/teachers/course/${courseId}/quiz-completion-count`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "Enrollments", id: courseId },
        { type: "QuizAttempt", id: courseId },
      ],
    }),

    getStudentsWithQuizCompletions: build.query<
      {
        courseId: string;
        title: string;
        enrollmentCount: number;
        studentsWithQuizzes: Array<{
          userId: string;
          fullName: string;
          email: string;
          completedQuizzes: Array<{
            quizId: string;
            title: string;
            score: number;
            totalQuestions: number;
            completionDate: string;
            attemptCount: number;
          }>;
          averageQuizScore: number;
          totalQuizzesCompleted: number;
        }>;
      },
      string
    >({
      query: (courseId) => ({
        url: `api/teachers/course/${courseId}/students-with-quiz-completions`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "Enrollments", id: courseId },
        { type: "QuizAttempt", id: courseId },
      ],
    }),

    getDetailedCourseStudentPerformance: build.query<
      {
        courseId: string;
        title: string;
        enrollmentCount: number;
        studentsWithQuizzesCount: number;
        quizCompletionRate: number;
        activeStudentsCount: number;
        courseActivityRate: number;
        students: Array<{
          userId: string;
          fullName: string;
          email: string;
          enrollmentDate: string;
          lastAccessDate: string;
          overallProgress: number;
          totalMaterialAccessCount: number;
          participationLevel: string;
          completedChaptersCount: number;
          hasCompletedQuizzes: boolean;
          completedQuizzes: Array<{
            quizId: string;
            title: string;
            score: number;
            totalQuestions: number;
            completionDate: string;
            attemptCount: number;
            scorePercentage: number;
          }>;
          averageQuizScore: number;
          totalQuizzesCompleted: number;
          discussionActivity: Array<{
            discussionId: string;
            postsCount: number;
            lastActivityDate: string;
          }>;
          totalDiscussionPosts: number;
        }>;
      },
      string
    >({
      query: (courseId) => ({
        url: `api/teachers/course/${courseId}/student-performance`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "Enrollments", id: courseId },
        { type: "QuizAttempt", id: courseId },
        { type: "StudentsOverview", id: courseId },
        { type: "StudentProgress", id: courseId },
      ],
    }),

    // Add updateUserGrade mutation
    updateUserGrade: build.mutation<
      { message: string; gradeId: string | null },
      { userId: string; gradeId: string | null }
    >({
      query: ({ userId, gradeId }) => ({
        url: `users/${userId}`,
        method: "PUT",
        body: { gradeId },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "Users", id: userId },
        "Users",
      ],
    }),
  }),
});

export const {
  useUpdateUserMutation,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetCoursesQuery,
  useGetCourseQuery,
  useGetUploadVideoUrlMutation,
  useGetUploadPresentationUrlMutation,
  useGetUploadDocumentUrlMutation,
  useGetUploadImageUrlMutation,
  useGetUserEnrolledCoursesQuery,
  useGetUserCourseProgressQuery,
  useGetUserQuizResultsQuery,
  useGetUserProgressSummaryQuery,
  useGetGradesQuery,
  useGetGradeQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
  useGetGradeCoursesQuery,
  useAddCourseToGradeMutation,
  useRemoveCourseFromGradeMutation,
  useEnrollCourseMutation,
  useGetChapterCommentsQuery,
  useAddChapterCommentMutation,
  useDeleteChapterCommentMutation,
  useGetQuizzesQuery,
  useGetQuizQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useAddQuizQuestionMutation,
  useUpdateQuizQuestionMutation,
  useDeleteQuizQuestionMutation,
  useGetMonthlyLeaderboardQuery,
  useGetPublicMonthlyLeaderboardQuery,
  useGetHomepageImagesQuery,
  useGetHomepageImageByIdQuery,
  useGetUploadUrlsMutation,
  useAddHomepageImagesMutation,
  useUpdateHomepageImageMutation,
  useDeleteHomepageImageMutation,
  useSearchCoursesQuery,
  useGetUserConversationsQuery,
  useGetConversationMessagesQuery,
  useSendChatMessageMutation,
  useMarkMessageAsReadMutation,
  useGetStudentsOverviewQuery,
  useGetCourseProgressAnalyticsQuery,
  useGetStudentProgressDetailsQuery,
  useGetUserQuery,
  useGetCourseProgressQuery,
  useGetCourseQuizResultsQuery,
  useGetStudentQuizResultsQuery,
  useGetEnrolledStudentsWithProgressQuery,
  useGetAllStudentsProgressQuery,
  useGetTeacherCoursesQuery,
  useGetAllTeacherCoursesWithAnalyticsQuery,
  useUpdateUserCourseProgressMutation,
  useGetUserDashboardQuery,
  useGetCourseEnrollmentCountQuery,
  useGetCourseEnrollmentDetailsQuery,
  useGetCourseQuizCompletionCountQuery,
  useGetStudentsWithQuizCompletionsQuery,
  useGetDetailedCourseStudentPerformanceQuery,
  useUpdateUserGradeMutation,
} = api;
