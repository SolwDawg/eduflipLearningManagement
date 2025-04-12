import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as z from "zod";
import { api } from "../state/api";
import { toast } from "sonner";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const customStyles = "text-gray-300 placeholder:text-gray-500";

export function convertToSubCurrency(amount: number, factor = 100) {
  return Math.round(amount * factor);
}

export const NAVBAR_HEIGHT = 48;

export const courseCategories = [
  { value: "technology", label: "Technology" },
  { value: "science", label: "Science" },
  { value: "mathematics", label: "Mathematics" },
  { value: "artificial-intelligence", label: "Artificial Intelligence" },
] as const;

export const customDataGridStyles = {
  border: "none",
  backgroundColor: "#17181D",
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#1B1C22",
    color: "#6e6e6e",
    "& [role='row'] > *": {
      backgroundColor: "#1B1C22 !important",
      border: "none !important",
    },
  },
  "& .MuiDataGrid-cell": {
    color: "#6e6e6e",
    border: "none !important",
  },
  "& .MuiDataGrid-row": {
    backgroundColor: "#17181D",
    "&:hover": {
      backgroundColor: "#25262F",
    },
  },
  "& .MuiDataGrid-footerContainer": {
    backgroundColor: "#17181D",
    color: "#6e6e6e",
    border: "none !important",
  },
  "& .MuiDataGrid-filler": {
    border: "none !important",
    backgroundColor: "#17181D !important",
    borderTop: "none !important",
    "& div": {
      borderTop: "none !important",
    },
  },
  "& .MuiTablePagination-root": {
    color: "#6e6e6e",
  },
  "& .MuiTablePagination-actions .MuiIconButton-root": {
    color: "#6e6e6e",
  },
};

export const createCourseFormData = (
  data: CourseFormData,
  sections: Section[] = [],
  imageUrl?: string,
  meetLink?: string
): FormData => {
  console.log("[createCourseFormData] Creating form data with:", {
    title: data.courseTitle,
    description: data.courseDescription,
    status: data.courseStatus ? "Published" : "Draft",
  });

  const formData = new FormData();

  // Add course title (required)
  console.log("[createCourseFormData] Appending title:", data.courseTitle);
  formData.append("title", data.courseTitle);

  // Add course description (required)
  console.log(
    "[createCourseFormData] Appending description:",
    data.courseDescription
  );
  formData.append("description", data.courseDescription);

  // Add URL image (optional)
  if (imageUrl) {
    console.log("[createCourseFormData] Appending image URL:", imageUrl);
    formData.append("image", imageUrl);
  }

  // Add status
  console.log(
    "[createCourseFormData] Appending status:",
    data.courseStatus ? "Published" : "Draft"
  );
  formData.append("status", data.courseStatus ? "Published" : "Draft");

  // Add Google Meet link if available
  if (meetLink) {
    console.log("[createCourseFormData] Appending meetLink:", meetLink);
    formData.append("meetLink", meetLink);
  }

  // Add sections
  const sectionsJson = JSON.stringify(sections);
  console.log("[createCourseFormData] Appending sections JSON", {
    sectionCount: sections.length,
  });
  formData.append("sections", sectionsJson);

  // Log all form data fields for debugging
  console.log(
    "[createCourseFormData] Form data created with fields:",
    Array.from(formData.keys())
  );

  return formData;
};

export const uploadAllFiles = async (
  localSections: Section[],
  courseId: string,
  getUploadVideoUrl: any,
  getUploadPresentationUrl: any
) => {
  const updatedSections = JSON.parse(JSON.stringify(localSections));

  // Get all upload promises
  const uploadPromises = [];

  // Track all chapters that need file uploads
  interface ChapterUpdate {
    sectionIndex: number;
    chapterIndex: number;
    field: string;
    value: string;
  }

  const chaptersToUpdate: ChapterUpdate[] = [];

  // First, collect all upload operations
  for (let i = 0; i < updatedSections.length; i++) {
    for (let j = 0; j < updatedSections[i].chapters.length; j++) {
      const chapter = updatedSections[i].chapters[j];
      const chapterFiles = window.chapterFiles?.[chapter.chapterId];

      if (chapterFiles) {
        if (chapterFiles.video instanceof File) {
          uploadPromises.push(
            uploadVideo(
              { ...chapter, video: chapterFiles.video },
              courseId,
              updatedSections[i].sectionId,
              getUploadVideoUrl
            )
              .then((result) => {
                chaptersToUpdate.push({
                  sectionIndex: i,
                  chapterIndex: j,
                  field: "video",
                  value: result.video,
                });
                return result;
              })
              .catch((error) => {
                console.error(
                  `Failed to upload video for chapter ${chapter.title}:`,
                  error
                );
                toast.error(`Lỗi khi tải lên video cho: ${chapter.title}`);
                return { error };
              })
          );
        }

        if (chapterFiles.presentation instanceof File) {
          uploadPromises.push(
            uploadPresentation(
              { ...chapter, presentation: chapterFiles.presentation },
              courseId,
              updatedSections[i].sectionId,
              getUploadPresentationUrl
            )
              .then((result) => {
                chaptersToUpdate.push({
                  sectionIndex: i,
                  chapterIndex: j,
                  field: "presentation",
                  value: result.presentation,
                });
                return result;
              })
              .catch((error) => {
                console.error(
                  `Failed to upload presentation for chapter ${chapter.title}:`,
                  error
                );
                toast.error(`Lỗi khi tải lên bài giảng cho: ${chapter.title}`);
                return { error };
              })
          );
        }

        // Clean up processed files
        if (window.chapterFiles) {
          delete window.chapterFiles[chapter.chapterId];
        }
      }
    }
  }

  // Execute all uploads in parallel
  if (uploadPromises.length > 0) {
    toast.info(`Đang tải lên ${uploadPromises.length}...`);
    await Promise.allSettled(uploadPromises);

    // Update the sections with uploaded file URLs
    chaptersToUpdate.forEach((update) => {
      if (updatedSections[update.sectionIndex]?.chapters[update.chapterIndex]) {
        updatedSections[update.sectionIndex].chapters[update.chapterIndex][
          update.field
        ] = update.value;
      }
    });
  }

  return updatedSections;
};

// Keep the uploadAllVideos function for backward compatibility
export const uploadAllVideos = async (
  localSections: Section[],
  courseId: string,
  getUploadVideoUrl: any,
  getUploadPresentationUrl: any = null
) => {
  const updatedSections = localSections.map((section) => ({
    ...section,
    chapters: section.chapters.map((chapter) => ({
      ...chapter,
    })),
  }));

  for (let i = 0; i < updatedSections.length; i++) {
    for (let j = 0; j < updatedSections[i].chapters.length; j++) {
      const chapter = updatedSections[i].chapters[j];
      // Handle video uploads
      if (chapter.video instanceof File) {
        try {
          console.log(`Uploading video for chapter: ${chapter.title}`);
          const updatedChapter = await uploadVideo(
            chapter,
            courseId,
            updatedSections[i].sectionId,
            getUploadVideoUrl
          );
          // Update only the video field, keeping other updates
          updatedSections[i].chapters[j] = {
            ...updatedSections[i].chapters[j],
            video: updatedChapter.video,
          };
          console.log(`Video upload complete for chapter: ${chapter.title}`);
        } catch (error) {
          console.error(
            `Failed to upload video for chapter ${chapter.chapterId}:`,
            error
          );
        }
      }

      // Handle PowerPoint presentations if available
      if (chapter.presentation instanceof File && getUploadPresentationUrl) {
        try {
          console.log(`Uploading PowerPoint for chapter: ${chapter.title}`);
          const updatedChapter = await uploadPresentation(
            chapter,
            courseId,
            updatedSections[i].sectionId,
            getUploadPresentationUrl
          );
          // Update only the presentation field, keeping other updates
          updatedSections[i].chapters[j] = {
            ...updatedSections[i].chapters[j],
            presentation: updatedChapter.presentation,
          };
          console.log(
            `PowerPoint upload complete for chapter: ${chapter.title}`
          );
        } catch (error) {
          console.error(
            `Failed to upload PowerPoint for chapter ${chapter.chapterId}:`,
            error
          );
        }
      }
    }
  }

  return updatedSections;
};

// Utility function to log upload URL (we don't test S3 pre-signed URLs with HEAD requests)
function logUploadUrl(url: string): void {
  // Simply log the URL without testing it
  // Extract the base URL without query parameters for security
  const baseUrl = url.split("?")[0];
  console.log(`Preparing to upload to: ${baseUrl}`);
}

async function uploadVideo(
  chapter: Chapter,
  courseId: string,
  sectionId: string,
  getUploadVideoUrl: any
) {
  const file = chapter.video as File;
  const MAX_RETRIES = 2;
  let retryCount = 0;

  const attemptUpload = async (): Promise<{ video: string }> => {
    try {
      // Start upload without waiting for toast
      console.log(
        `Getting upload URL for video: ${file.name} (${file.size} bytes)`
      );
      const { uploadUrl, videoUrl } = await getUploadVideoUrl({
        courseId,
        sectionId,
        chapterId: chapter.chapterId,
        fileName: file.name,
        fileType: file.type,
      }).unwrap();

      // Log the URL for debugging
      console.log(`Upload URL received. Preparing to upload to S3...`);
      logUploadUrl(uploadUrl);

      try {
        // Use axios instead of fetch with increased timeout
        console.log(
          `Starting upload of ${file.name} (${(file.size / 1024 / 1024).toFixed(
            2
          )} MB)`
        );
        const response = await axios.put(uploadUrl, file, {
          headers: {
            "Content-Type": file.type,
          },
          // Increase timeout for larger files - videos need more time
          timeout: Math.max(60000, file.size / 512), // Minimum 60s, or 2ms per KB
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`Upload progress: ${percentCompleted}%`);
            }
          },
        });

        console.log(`Upload completed with status: ${response.status}`);
        if (response.status !== 200) {
          throw new Error(
            `Server responded with status: ${response.status}, ${response.statusText}`
          );
        }
      } catch (axiosError: unknown) {
        if (axios.isAxiosError(axiosError)) {
          // Check if it's a timeout
          if (axiosError.code === "ECONNABORTED") {
            console.error(
              `Upload timed out for file ${file.name}. File might be too large or connection too slow.`
            );
            toast.error(
              `Đã hết thời gian tải lên. Tệp có thể quá lớn hoặc kết nối quá chậm.`
            );
          } else {
            // Log more detailed error information
            console.error(
              `Network error when uploading video for chapter ${chapter.title}:`,
              {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                statusText: axiosError.response?.statusText,
                data: axiosError.response?.data || "No response data",
                url: axiosError.config?.url
                  ? axiosError.config.url.split("?")[0]
                  : "Unknown URL",
              }
            );
          }

          // If we haven't maxed out retries, try again
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(
              `Retrying upload (attempt ${retryCount} of ${MAX_RETRIES})...`
            );
            toast.info(
              `Đang tải lên lại (thử lại ${retryCount} lần của ${MAX_RETRIES})...`
            );
            return await attemptUpload();
          }

          toast.error(
            `Lỗi khi tải lên: ${axiosError.message}. Vui lòng kiểm tra kết nối và thử lại.`
          );
        } else {
          console.error(
            `Unknown error when uploading video for chapter ${chapter.title}:`,
            axiosError
          );
          toast.error(`Lỗi không xác định khi tải lên. Vui lòng thử lại sau.`);
        }
        throw new Error(
          `Failed to upload video: ${
            axios.isAxiosError(axiosError)
              ? axiosError.message
              : "Network error"
          }`
        );
      }

      // Only show success toast for large files
      if (file.size > 5 * 1024 * 1024) {
        // Only for files > 5MB
        toast.success(`Video đã được tải lên: ${chapter.title}`);
      }

      return { video: videoUrl };
    } catch (error) {
      console.error(
        `Failed to upload video for chapter ${chapter.chapterId}:`,
        error
      );
      throw error;
    }
  };

  return { ...chapter, ...(await attemptUpload()) };
}

async function uploadPresentation(
  chapter: Chapter,
  courseId: string,
  sectionId: string,
  getUploadPresentationUrl: any
) {
  const file = chapter.presentation as File;
  const MAX_RETRIES = 3; // Increase max retries
  let retryCount = 0;

  const attemptUpload = async (): Promise<{ presentation: string }> => {
    try {
      // Validate file extension first
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const validExtensions = ["ppt", "pptx", "pps", "ppsx"];

      if (!fileExt || !validExtensions.includes(fileExt)) {
        const error = new Error(
          `Loại tệp bài giảng không hợp lệ: ${fileExt}. Định dạng hỗ trợ: .ppt, .pptx, .pps, .ppsx`
        );
        console.error(error.message);
        toast.error(error.message);
        throw error;
      }

      // Start upload without waiting for toast
      console.log(
        `Getting upload URL for PowerPoint: ${file.name} (${file.size} bytes)`
      );

      // Add error handling for the API call to get the upload URL
      let uploadUrlResponse;
      try {
        uploadUrlResponse = await getUploadPresentationUrl({
          courseId,
          sectionId,
          chapterId: chapter.chapterId,
          fileName: file.name,
          fileType: file.type,
        }).unwrap();
      } catch (apiError: any) {
        console.error("Failed to get pre-signed URL from API:", apiError);
        toast.error(
          `Không thể lấy URL tải lên: ${
            apiError?.message || "Lỗi API không xác định"
          }`
        );
        throw new Error(
          `API error: ${apiError?.message || "Failed to get upload URL"}`
        );
      }

      const { uploadUrl, presentationUrl } = uploadUrlResponse;

      // Log the URL for debugging (but remove any sensitive parts)
      console.log(
        `Upload URL received for PowerPoint. Preparing to upload to S3...`
      );
      logUploadUrl(uploadUrl);

      try {
        // Use axios instead of fetch with increased timeout
        console.log(
          `Starting upload of PowerPoint: ${file.name} (${(
            file.size /
            1024 /
            1024
          ).toFixed(2)} MB)`
        );

        // Increase timeout for larger files - much more generous
        const calculatedTimeout = Math.max(120000, file.size / 256); // Minimum 2 minutes, or ~4ms per KB
        console.log(
          `Using timeout of ${Math.round(
            calculatedTimeout / 1000
          )} seconds for upload`
        );

        const response = await axios.put(uploadUrl, file, {
          headers: {
            "Content-Type": file.type,
          },
          timeout: calculatedTimeout,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`PowerPoint upload progress: ${percentCompleted}%`);
            }
          },
        });

        console.log(
          `PowerPoint upload completed with status: ${response.status}`
        );
        if (response.status !== 200) {
          throw new Error(
            `Server responded with status: ${response.status}, ${response.statusText}`
          );
        }
      } catch (axiosError: unknown) {
        if (axios.isAxiosError(axiosError)) {
          // Check if it's a timeout
          if (axiosError.code === "ECONNABORTED") {
            console.error(
              `Upload timed out for PowerPoint ${file.name}. File might be too large or connection too slow.`
            );
            toast.error(
              `Đã hết thời gian tải lên bài giảng. Tệp có thể quá lớn hoặc kết nối quá chậm.`
            );
          } else {
            // Log more detailed error information
            console.error(
              `Network error when uploading PowerPoint for chapter ${chapter.title}:`,
              {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                statusText: axiosError.response?.statusText,
                data: axiosError.response?.data || "No response data",
                url: axiosError.config?.url
                  ? axiosError.config.url.split("?")[0]
                  : "Unknown URL",
              }
            );

            // Check if response contains S3 error details
            if (axiosError.response?.data) {
              const responseData = axiosError.response.data;
              console.error("S3 Error Response:", responseData);
            }
          }

          // If we haven't maxed out retries, try again with exponential backoff
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const backoffTime = Math.min(
              1000 * Math.pow(2, retryCount - 1),
              10000
            );
            console.log(
              `Retrying PowerPoint upload in ${
                backoffTime / 1000
              } seconds (attempt ${retryCount} of ${MAX_RETRIES})...`
            );
            toast.info(
              `Đang tải lên lại bài giảng (thử lại ${retryCount} lần của ${MAX_RETRIES})...`
            );

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, backoffTime));
            return await attemptUpload();
          }

          toast.error(
            `Lỗi khi tải lên bài giảng: ${axiosError.message}. Vui lòng kiểm tra kết nối và thử lại.`
          );
        } else {
          console.error(
            `Unknown error when uploading PowerPoint for chapter ${chapter.title}:`,
            axiosError
          );
          toast.error(
            `Lỗi không xác định khi tải lên bài giảng. Vui lòng thử lại sau.`
          );
        }
        throw new Error(
          `Failed to upload PowerPoint: ${
            axios.isAxiosError(axiosError)
              ? axiosError.message
              : "Network error"
          }`
        );
      }

      // Only show success toast for larger files
      if (file.size > 2 * 1024 * 1024) {
        // Only for files > 2MB
        toast.success(`Bài giảng đã được tải lên: ${chapter.title}`);
      }

      return { presentation: presentationUrl };
    } catch (error) {
      console.error(
        `Failed to upload PowerPoint for chapter ${chapter.chapterId}:`,
        error
      );
      throw error;
    }
  };

  return { ...chapter, ...(await attemptUpload()) };
}

// Export the uploadPresentation function so it's available for use outside this file
export { uploadVideo, uploadPresentation };

/**
 * Format a date string into a readable format
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Formats a date string into a localized format
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDateString(dateString: string): string {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (error) {
    return "Invalid Date";
  }
}
