"use client";

import { CustomFormField } from "@/components/CustomFormField";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { courseSchema } from "@/lib/schemas";
import {
  createCourseFormData,
  uploadAllFiles,
  uploadPresentation,
  uploadVideo,
} from "@/lib/utils";
import { openSectionModal, setSections } from "@/state";
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
  useGetUploadVideoUrlMutation,
  useGetUploadImageUrlMutation,
  useGetUploadPresentationUrlMutation,
} from "@/state/api";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Plus,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  BookCheck,
  BarChart3,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DroppableComponent from "./Droppable";
import ChapterModal from "./ChapterModal";
import SectionModal from "./SectionModal";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const CourseEditor = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Setup network monitoring for debugging
  useEffect(() => {
    // Only run in development and client-side
    if (typeof window !== "undefined") {
      console.log("[NetworkMonitor] Setting up API call monitoring");

      // Save original fetch
      const originalFetch = window.fetch;

      // Override fetch to monitor requests
      window.fetch = async function (input, init) {
        let url: string;
        if (typeof input === "string") {
          url = input;
        } else if (input instanceof Request) {
          url = input.url;
        } else {
          url = input.toString();
        }

        // Only monitor course update calls
        if (url.includes(`courses/${id}`) && init?.method === "PUT") {
          console.log("[NetworkMonitor] Detected course update API call", {
            url,
            method: init?.method,
            headers: init?.headers,
            bodyType:
              init?.body instanceof FormData ? "FormData" : typeof init?.body,
          });

          // Log form data if available
          if (init?.body instanceof FormData) {
            console.log(
              "[NetworkMonitor] Form data fields:",
              Array.from((init.body as FormData).keys())
            );
          }

          try {
            console.log("[NetworkMonitor] Sending request...");
            const startTime = Date.now();
            const response = await originalFetch(input, init);
            const endTime = Date.now();
            console.log(
              `[NetworkMonitor] Response received in ${endTime - startTime}ms`
            );

            const responseClone = response.clone();

            try {
              const responseData = await responseClone.json();
              console.log("[NetworkMonitor] Course update API response", {
                status: response.status,
                statusText: response.statusText,
                data: responseData,
                responseTime: `${endTime - startTime}ms`,
              });
            } catch (e) {
              console.log("[NetworkMonitor] Could not parse response as JSON", {
                status: response.status,
                statusText: response.statusText,
                error: e instanceof Error ? e.message : String(e),
              });

              // Try to read as text if JSON parsing fails
              try {
                const textResponseClone = response.clone();
                const textData = await textResponseClone.text();
                console.log(
                  "[NetworkMonitor] Response as text:",
                  textData.substring(0, 500)
                );
              } catch (textError) {
                console.log("[NetworkMonitor] Failed to read response as text");
              }
            }

            return response;
          } catch (error) {
            console.error("[NetworkMonitor] Course update API error", error);
            throw error;
          }
        }

        return originalFetch(input, init);
      };

      // Cleanup function
      return () => {
        window.fetch = originalFetch;
        console.log("[NetworkMonitor] Restored original fetch");
      };
    }
  }, [id]);

  const { data: course, isLoading, refetch } = useGetCourseQuery(id);
  const [updateCourse] = useUpdateCourseMutation();
  const [getUploadVideoUrl] = useGetUploadVideoUrlMutation();
  const [getUploadPresentationUrl] = useGetUploadPresentationUrlMutation();
  const [getUploadImageUrl] = useGetUploadImageUrlMutation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState<string>("");
  const [isUpdatingMeetLink, setIsUpdatingMeetLink] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const { sections } = useAppSelector((state) => state.global.courseEditor);

  const methods = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseTitle: "",
      courseDescription: "",
      courseStatus: false,
    },
  });

  useEffect(() => {
    if (course) {
      methods.reset({
        courseTitle: course.title,
        courseDescription: course.description,
        courseStatus: course.status === "Published",
      });
      dispatch(setSections(course.sections || []));
      setImagePreview(course.image || null);
      setMeetLink(course.meetLink || "");
    }
  }, [course, methods]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadCourseImage = async () => {
    if (!imageFile) return null;

    try {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const fileType = imageFile.type;

      // Get pre-signed URL for upload
      const { uploadUrl, imageUrl } = await getUploadImageUrl({
        courseId: id,
        fileName,
        fileType,
      }).unwrap();

      // Upload the image file to the pre-signed URL
      await fetch(uploadUrl, {
        method: "PUT",
        body: imageFile,
        headers: {
          "Content-Type": fileType,
        },
      });

      return imageUrl;
    } catch (error) {
      console.error("Error uploading course image:", error);
      toast.error("Không thể cập nhật khoá học. Vui lòng thử lại.");
      return null;
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      console.log("[CourseEditor] Starting save process", {
        title: data.courseTitle,
        description: data.courseDescription,
        status: data.courseStatus ? "Published" : "Draft",
      });

      // Validate title and description specifically
      const titleValid = data.courseTitle.trim().length > 0;
      const descriptionValid = data.courseDescription.trim().length > 0;

      if (!titleValid || !descriptionValid) {
        console.error(
          "[CourseEditor] Validation failed for title or description",
          {
            titleValid,
            descriptionValid,
            title: data.courseTitle,
            description: data.courseDescription,
          }
        );

        if (!titleValid) {
          toast.error("Tiêu đề khoá học không được để trống");
          methods.setError("courseTitle", { message: "Title is required" });
        }

        if (!descriptionValid) {
          toast.error("Mô tả khoá học không được để trống");
          methods.setError("courseDescription", {
            message: "Description is required",
          });
        }

        return;
      }

      // Add loading state
      const saveButtonElement = document.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement;
      if (saveButtonElement) {
        saveButtonElement.disabled = true;
        saveButtonElement.textContent = "Saving...";
      }

      toast.info("Đang lưu khoá học...");
      console.log("[CourseEditor] Form data valid, proceeding with save");

      // Start image upload (if any) in parallel
      const imageUploadPromise = imageFile
        ? uploadCourseImage()
        : Promise.resolve(null);

      console.log("[CourseEditor] Processing section uploads");
      // Process all file uploads in parallel
      const updatedSections = await uploadAllFiles(
        sections,
        id,
        getUploadVideoUrl,
        getUploadPresentationUrl
      );
      console.log("[CourseEditor] Sections processed", {
        sectionCount: updatedSections.length,
      });

      // Get the image URL from the parallel upload
      const imageUrl = await imageUploadPromise;
      console.log("[CourseEditor] Image upload completed", {
        hasImage: !!imageUrl,
      });

      // Create form data with all updated information
      console.log("[CourseEditor] Creating form data");
      const formData = createCourseFormData(
        data,
        updatedSections,
        imageUrl || (imagePreview !== null ? imagePreview : undefined),
        meetLink || undefined
      );

      // Log form data entries for debugging
      console.log(
        "[CourseEditor] Form data created with the following entries:"
      );
      for (const [key, value] of formData.entries()) {
        console.log(`- ${key}: ${key === "sections" ? "JSON data" : value}`);
      }

      // Update the course
      console.log(
        "[CourseEditor] Calling updateCourse API with course ID:",
        id
      );
      try {
        console.log("[CourseEditor] Making updateCourse API call with:", {
          courseId: id,
          hasFormData: !!formData,
          formDataKeys: Array.from(formData.keys()),
        });

        // Instead of FormData, let's use a direct JSON object for simplicity
        const courseData = {
          title: data.courseTitle,
          description: data.courseDescription,
          status: data.courseStatus ? "Published" : "Draft",
          sections: updatedSections,
          meetLink: meetLink || undefined,
          image: imageUrl || (imagePreview !== null ? imagePreview : undefined),
        };

        console.log(
          "[CourseEditor] Using JSON approach with data:",
          courseData
        );

        try {
          const token = await window.Clerk?.session?.getToken();
          const baseUrl =
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001";

          const response = await fetch(`${baseUrl}/courses/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(courseData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `API call failed: ${response.status} ${response.statusText} - ${errorText}`
            );
          }

          const result = await response.json();
          console.log("[CourseEditor] Update successful:", result);
        } catch (fetchError) {
          console.error("[CourseEditor] Direct fetch failed:", fetchError);
          throw fetchError;
        }

        toast.success("Khoá học đã được cập nhật thành công");
        await refetch();
      } catch (updateError) {
        console.error("[CourseEditor] Error in course update:", updateError);
        toast.error("Không thể cập nhật khoá học. Vui lòng thử lại sau.");
      } finally {
        const saveButtonElement = document.querySelector(
          'button[type="submit"]'
        ) as HTMLButtonElement;

        if (saveButtonElement) {
          saveButtonElement.disabled = false;
          saveButtonElement.textContent = methods.watch("courseStatus")
            ? "Cập nhật khoá học đã xuất bản"
            : "Lưu bản nháp";
          console.log("[CourseEditor] Save button restored to original state");
        }
      }

      if (window.chapterFiles) {
        window.chapterFiles = {};
      }
    } catch (error) {
      console.error("Failed to update course:", error);
      toast.error("Không thể cập nhật khoá học. Vui lòng thử lại.");
      return null;
    }
  };

  const handleUpdateMeetLink = async () => {
    if (!meetLink) {
      toast.error("Vui lòng nhập liên kết Google Meet hoặc mã");
      return;
    }

    try {
      setIsUpdatingMeetLink(true);
      const response = await fetch(`/api/courses/${id}/meet-link`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meetLink }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Liên kết Google Meet đã được cập nhật thành công");
        refetch(); // Refresh course data
      } else {
        console.error("Không thể cập nhật liên kết Google Meet:", data);
        toast.error(data.message || "Không thể cập nhật liên kết Google Meet");
      }
    } catch (error) {
      console.error("Không thể cập nhật liên kết Google Meet:", error);
      toast.error("Không thể cập nhật liên kết Google Meet");
    } finally {
      setIsUpdatingMeetLink(false);
    }
  };

  const copyMeetLinkToClipboard = () => {
    if (meetLink) {
      navigator.clipboard.writeText(meetLink);
      toast.success("Liên kết Google Meet đã được sao chép vào bảng tạm");
    }
  };

  const openMeetLink = () => {
    if (meetLink) {
      window.open(meetLink, "_blank");
    }
  };

  const generateMeetLink = async () => {
    try {
      setIsUpdatingMeetLink(true);
      const response = await fetch(`/api/courses/${id}/meet-link`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ generateNew: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setMeetLink(data.data.meetLink);
        toast.success("Liên kết Google Meet mới đã được tạo thành công");
        refetch(); // Refresh course data
      } else {
        console.error("Không thể tạo liên kết Google Meet:", data);
        toast.error(data.message || "Không thể tạo liên kết Google Meet");
      }
    } catch (error) {
      console.error("Không thể tạo liên kết Google Meet:", error);
      toast.error("Không thể tạo liên kết Google Meet");
    } finally {
      setIsUpdatingMeetLink(false);
    }
  };

  // Add a function to extract meeting code from URL
  const extractMeetCode = (url: string): string => {
    try {
      // Extract the meeting code from the URL (format: meet.google.com/xxx-xxxx-xxx)
      const regex = /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i;
      const match = url.match(regex);
      if (match && match[1]) {
        return match[1];
      }
      return url; // Return the original URL if no match
    } catch (error) {
      console.error("Error extracting meeting code:", error);
      return url;
    }
  };

  // Add a function to create meeting
  const createMeeting = async () => {
    try {
      setIsUpdatingMeetLink(true);

      // Open Google Meet in a new window
      const meetWindow = window.open("https://meet.google.com/new", "_blank");

      // Show instructions to the user
      toast.success(
        "Đã tạo cuộc họp mới! Sao chép mã từ thanh địa chỉ và dán lại vào đây.",
        { duration: 6000 }
      );

      // Focus back on the input field for pasting
      setTimeout(() => {
        toast.info("Định dạng: xxx-xxxx-xxx (ví dụ: abc-defg-hij)", {
          duration: 4000,
        });
      }, 1000);
    } catch (error) {
      console.error("Không thể tạo cuộc họp Google Meet:", error);
      toast.error("Không thể tạo cuộc họp Google Meet");
    } finally {
      setIsUpdatingMeetLink(false);
    }
  };

  // Handle meeting actions based on whether a meet link exists
  const handleMeetingActions = () => {
    if (course?.meetLink) {
      // If there's already a meeting link, open it
      window.open(`https://meet.google.com/${course.meetLink}`, "_blank");
    } else {
      // Otherwise create a new meeting
      createMeeting();
    }
  };

  return (
    <div className="dashboard-container">
      <div className="course-editor">
        <div className="course-editor__header">
          <div className="course-editor__back">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/teacher/courses")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="course-editor__title">
            <h1>{course?.title || "Khoá học mới"}</h1>
          </div>
          <div className="course-editor__actions my-4">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => router.push(`/teacher/courses/${id}/quizzes`)}
            >
              <BookCheck className="mr-2 h-4 w-4" />
              Bài kiểm tra
            </Button>

            <Button
              type="button"
              onClick={handleMeetingActions}
              className="whitespace-nowrap"
              variant="outline"
            >
              {course?.meetLink ? (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Google Meet
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Tạo Google Meet
                </>
              )}
            </Button>
          </div>
        </div>

        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Header
              title="Thiết lập khoá học"
              subtitle="Hoàn tất tất cả các trường và lưu khoá học của bạn"
              rightElement={
                <div className="flex items-center space-x-4">
                  <CustomFormField
                    name="courseStatus"
                    label={
                      methods.watch("courseStatus") ? "Đã xuất bản" : "Bản nháp"
                    }
                    type="switch"
                    className="flex items-center space-x-2"
                    labelClassName={`text-sm font-medium ${
                      methods.watch("courseStatus")
                        ? "text-green-500"
                        : "text-yellow-500"
                    }`}
                    inputClassName="data-[state=checked]:bg-green-500"
                  />
                  <Button
                    type="submit"
                    className="bg-primary-700 hover:bg-primary-600"
                  >
                    {methods.watch("courseStatus")
                      ? "Cập nhật khoá học đã xuất bản"
                      : "Lưu bản nháp"}
                  </Button>
                </div>
              }
            />

            <div className="flex justify-between md:flex-row flex-col gap-10 mt-5 font-dm-sans">
              <div className="basis-1/2">
                <div className="space-y-4">
                  <CustomFormField
                    name="courseTitle"
                    label="Tiêu đề khoá học"
                    type="text"
                    placeholder="Tiêu đề khoá học"
                    className="border-none"
                    initialValue={course?.title}
                  />

                  <CustomFormField
                    name="courseDescription"
                    label="Mô tả khoá học"
                    type="textarea"
                    placeholder="Mô tả khoá học"
                    initialValue={course?.description}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Liên kết lớp trực tuyến
                    </label>
                    <div className="flex flex-col space-y-3">
                      <div className="relative flex items-center">
                        <div className="absolute left-3">
                          <LinkIcon size={16} className="text-gray-500" />
                        </div>
                        <Input
                          type="text"
                          placeholder="Nhập mã cuộc họp (ví dụ: abc-defg-hij)"
                          value={meetLink}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue.includes("meet.google.com/")) {
                              setMeetLink(extractMeetCode(inputValue));
                            } else {
                              setMeetLink(inputValue);
                            }
                          }}
                          className="pl-10"
                        />
                        <div className="absolute right-2 flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={copyMeetLinkToClipboard}
                                  disabled={!meetLink}
                                  className="h-8 w-8"
                                >
                                  <Copy size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy link</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (meetLink) {
                                      // Make sure it's a valid URL
                                      const url = meetLink.includes("http")
                                        ? meetLink
                                        : `https://meet.google.com/${meetLink}`;
                                      window.open(url, "_blank");
                                    }
                                  }}
                                  disabled={!meetLink}
                                  className="h-8 w-8"
                                >
                                  <ExternalLink size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mở liên kết</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleUpdateMeetLink}
                          disabled={isUpdatingMeetLink || !meetLink}
                          className="w-fit"
                        >
                          {isUpdatingMeetLink
                            ? "Đang cập nhật..."
                            : "Lưu liên kết"}
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={generateMeetLink}
                          disabled={isUpdatingMeetLink}
                          className="w-fit"
                        >
                          Tạo cuộc họp mới
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Nhập mã cuộc họp (ví dụ: abc-defg-hij) hoặc dán liên kết
                        hoàn chỉnh. Nhấp vào &quot;Tạo cuộc họp mới&quot; để tạo
                        cuộc họp Google Meet mới, sau đó sao chép mã từ thanh
                        địa chỉ và dán lại vào đây.{" "}
                        <span className="text-primary-700">
                          Liên kết cuộc họp sẽ được lưu tự động khi bạn cập nhật
                          khoá học.
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Hình ảnh khoá học
                    </label>
                    <div className="flex flex-col space-y-3">
                      {imagePreview && (
                        <div className="relative w-full h-40 rounded-md overflow-hidden">
                          <Image
                            width={200}
                            height={200}
                            src={imagePreview}
                            alt="Course preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setImageFile(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        id="courseImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:text-white-100 file:border-0 file:text-sm file:font-semibold
                          file:bg-primary-700 file:text-white hover:file:bg-primary-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white-50 mt-4 md:mt-0 p-4 rounded-lg basis-1/2">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-semibold text-black">Chương</h2>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      dispatch(openSectionModal({ sectionIndex: null }))
                    }
                    className="border-none text-primary-700 group"
                  >
                    <Plus className="mr-1 h-4 w-4 text-primary-700 group-hover:white-100" />
                    <span className="text-primary-700 group-hover:white-100">
                      Thêm chương
                    </span>
                  </Button>
                </div>

                {isLoading ? (
                  <p>Đang tải nội dung khoá học...</p>
                ) : sections.length > 0 ? (
                  <DroppableComponent />
                ) : (
                  <p>Không có chương trình học nào</p>
                )}
              </div>
            </div>
          </form>
        </Form>

        <ChapterModal />
        <SectionModal />
      </div>
    </div>
  );
};

export default CourseEditor;
