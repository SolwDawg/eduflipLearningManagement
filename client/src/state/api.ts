import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BaseQueryApi, FetchArgs } from "@reduxjs/toolkit/query";
import { User } from "@clerk/nextjs/server";
import { Clerk } from "@clerk/clerk-js";
import { toast } from "sonner";
import { Quiz } from "@/types/quiz";

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
      const token = await window.Clerk?.session?.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
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

      // Check if this is the courses endpoint with category
      const isCoursesEndpoint =
        (typeof args === "string" && args === "courses") ||
        (typeof args === "object" && args.url === "courses");

      // Check if this is a quizzes endpoint
      const isQuizzesEndpoint =
        typeof args === "string"
          ? args.includes("/quizzes/course/")
          : args.url.includes("/quizzes/course/");

      // Check if this is a categories endpoint
      const isCategoriesEndpoint =
        (typeof args === "string" && args === "categories") ||
        (typeof args === "object" && args.url === "categories");

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

      // Skip showing toast for certain errors
      if (
        !(isEnrolledCoursesEndpoint && result.error.status === 500) &&
        !(isCoursesEndpoint && result.error.status === 500) &&
        !(isQuizzesEndpoint && result.error.status === 500) &&
        !(isCategoriesEndpoint && result.error.status === 500) &&
        !isCourseProgressNotFound && // Don't show toast for course progress not found
        result.error.status !== "PARSING_ERROR" // Skip showing toast for parsing errors
      ) {
        toast.error(`Error: ${errorMessage}`);
      }

      // Log detailed error information (except for expected "not found" cases)
      if (!isCourseProgressNotFound) {
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
        (isQuizzesEndpoint && result.error.status === 500) ||
        (isCategoriesEndpoint && result.error.status === 500)
      ) {
        console.log(
          `Returning empty array for failed ${
            isQuizzesEndpoint
              ? "quizzes"
              : isCategoriesEndpoint
              ? "categories"
              : "courses"
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

    return { error: { status: "FETCH_ERROR", error: errorMessage } };
  }
};

export const api = createApi({
  baseQuery: customBaseQuery,
  reducerPath: "api",
  tagTypes: [
    "Courses",
    "Users",
    "UserCourseProgress",
    "Grades",
    "Comments",
    "Quizzes",
    "Course",
    "CourseProgress",
    "Enrollments",
    "CourseProgressByChapter",
    "EnrolledCourses",
    "Quiz",
    "QuizAttempt",
    "Discussions",
    "Leaderboard",
  ],
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
    getCourses: build.query<Course[], { category?: string }>({
      query: ({ category }) => ({
        url: "courses",
        params: category && category !== "all" ? { category } : undefined,
      }),
      providesTags: ["Courses"],
    }),

    getCourse: build.query<Course, string>({
      query: (id) => `courses/${id}`,
      providesTags: (result, error, id) => [{ type: "Courses", id }],
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
      query: (userId) => `users/course-progress/${userId}/enrolled-courses`,
      providesTags: ["Courses", "UserCourseProgress"],
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
      UserCourseProgress,
      { userId: string; courseId: string }
    >({
      query: ({ userId, courseId }) =>
        `users/course-progress/${userId}/courses/${courseId}`,
      providesTags: ["UserCourseProgress"],
    }),

    updateUserCourseProgress: build.mutation<
      UserCourseProgress,
      {
        userId: string;
        courseId: string;
        progressData: {
          sections: SectionProgress[];
        };
      }
    >({
      query: ({ userId, courseId, progressData }) => ({
        url: `users/course-progress/${userId}/courses/${courseId}`,
        method: "PUT",
        body: progressData,
      }),
      invalidatesTags: ["UserCourseProgress"],
      async onQueryStarted(
        { userId, courseId, progressData },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            "getUserCourseProgress",
            { userId, courseId },
            (draft) => {
              Object.assign(draft, {
                ...draft,
                sections: progressData.sections,
              });
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    getMonthlyLeaderboard: build.query<any, void>({
      query: () => "users/course-progress/leaderboard/monthly",
      providesTags: ["Leaderboard"],
    }),

    /* 
    ===============
    GRADES
    =============== 
    */
    getGrades: build.query<Grade[], void>({
      query: () => `grades`,
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
      providesTags: ["Quizzes"],
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

    // Course-related endpoints with category suggestions
    getRelatedCourses: build.query({
      query: (categorySlug) => `courses/category/${categorySlug}`,
      providesTags: (result, error, categorySlug) => [
        { type: "Course", id: `category-${categorySlug}` },
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
  useGetUploadImageUrlMutation,
  useGetUserEnrolledCoursesQuery,
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
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
  useGetRelatedCoursesQuery,
  useGetMonthlyLeaderboardQuery,
} = api;
