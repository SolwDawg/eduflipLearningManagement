"use client";

import { CustomFormField } from "@/components/CustomFormField";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { courseSchema } from "@/lib/schemas";
import { createCourseFormData, uploadAllVideos } from "@/lib/utils";
import { openSectionModal, setSections } from "@/state";
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
  useGetUploadVideoUrlMutation,
  useGetUploadImageUrlMutation,
  useGetCategoriesQuery,
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
  const { data: course, isLoading, refetch } = useGetCourseQuery(id);
  const { data: categoriesData } = useGetCategoriesQuery({});
  const [updateCourse] = useUpdateCourseMutation();
  const [getUploadVideoUrl] = useGetUploadVideoUrlMutation();
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
      courseCategory: "",
      courseStatus: false,
    },
  });

  useEffect(() => {
    if (course) {
      methods.reset({
        courseTitle: course.title,
        courseDescription: course.description,
        courseCategory: course.category,
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
      return null;
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      const updatedSections = await uploadAllVideos(
        sections,
        id,
        getUploadVideoUrl
      );

      // Upload course image if present
      const imageUrl = await uploadCourseImage();

      // Convert null to undefined to match the expected parameter type
      const formData = createCourseFormData(
        data,
        updatedSections,
        imageUrl || undefined,
        meetLink || undefined
      );

      await updateCourse({
        courseId: id,
        formData,
      }).unwrap();

      toast.success("Khoá học đã được cập nhật thành công");
      refetch();
    } catch (error) {
      console.error("Failed to update course:", error);
      toast.error("Không thể cập nhật khoá học");
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

  // Format category options for the dropdown
  const categoryOptions = React.useMemo(() => {
    if (!categoriesData?.data) return [];
    return categoriesData.data
      .filter((category: any) => category.isActive)
      .map((category: any) => ({
        label: category.name,
        value: category.slug,
      }));
  }, [categoriesData]);

  return (
    <div>
      <div className="pb-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/teacher/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Header
            title="Quản lý khoá học"
            subtitle="Chỉnh sửa chi tiết khoá học"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <Button variant="outline" asChild>
            <Link href={`/teacher/courses/${id}/quizzes`}>
              <BookCheck className="h-4 w-4 mr-2" />
              Quản lý bài kiểm tra
            </Link>
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

                <CustomFormField
                  name="courseCategory"
                  label="Môn học"
                  type="select"
                  options={categoryOptions}
                  initialValue={course?.category}
                  placeholder="Chọn môn học"
                  description={
                    <>
                      Chọn môn học phù hợp với khoá học của bạn.
                      <Link
                        href="/teacher/categories"
                        className="ml-1 text-primary hover:underline"
                      >
                        Quản lý môn học
                      </Link>
                      {categoryOptions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {categoryOptions.slice(0, 5).map((cat: any) => (
                            <HoverCard key={cat.value}>
                              <HoverCardTrigger asChild>
                                <Badge
                                  variant={
                                    course?.category === cat.value
                                      ? "default"
                                      : "outline"
                                  }
                                  className="cursor-pointer"
                                  onClick={() =>
                                    methods.setValue(
                                      "courseCategory",
                                      cat.value
                                    )
                                  }
                                >
                                  {cat.label}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="text-sm">
                                  <p className="font-medium">{cat.label}</p>
                                  <p className="text-muted-foreground">
                                    {
                                      categoriesData?.data.find(
                                        (c) => c.slug === cat.value
                                      )?.description
                                    }
                                  </p>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ))}
                          {categoryOptions.length > 5 && (
                            <Badge variant="outline">
                              +{categoryOptions.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </>
                  }
                />

                {/* Google Meet Link Section */}
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
                          // Extract code if full URL is pasted
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
                              <p>Open link</p>
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
                        {isUpdatingMeetLink ? "Updating..." : "Save Meet Link"}
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={createMeeting}
                        disabled={isUpdatingMeetLink}
                        className="w-fit"
                      >
                        Tạo cuộc họp mới
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Nhập mã cuộc họp (ví dụ: abc-defg-hij) hoặc dán liên kết
                      hoàn chỉnh. Nhấp vào &quot;Tạo cuộc họp mới&quot; để tạo
                      cuộc họp Google Meet mới, sau đó sao chép mã từ thanh địa
                      chỉ và dán lại vào đây.{" "}
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
                        file:rounded-full file:border-0 file:text-sm file:font-semibold
                        file:bg-primary-700 file:text-white hover:file:bg-primary-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-customgreys-darkGrey mt-4 md:mt-0 p-4 rounded-lg basis-1/2">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-secondary-foreground">
                  Chương
                </h2>

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
  );
};

export default CourseEditor;
