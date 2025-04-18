import { CustomFormField } from "@/components/CustomFormField";
import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChapterFormData, chapterSchema } from "@/lib/schemas";
import { addChapter, closeChapterModal, editChapter } from "@/state";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Video, X, FileText } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const ChapterModal = () => {
  const dispatch = useAppDispatch();
  const {
    isChapterModalOpen,
    selectedSectionIndex,
    selectedChapterIndex,
    sections,
  } = useAppSelector((state) => state.global.courseEditor);

  const chapter: Chapter | undefined =
    selectedSectionIndex !== null && selectedChapterIndex !== null
      ? sections[selectedSectionIndex].chapters[selectedChapterIndex]
      : undefined;

  const methods = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: "",
      content: "",
      video: "",
      presentation: "",
      document: "",
    },
  });

  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || "",
        presentation: chapter.presentation || "",
        document: chapter.document || "",
      });
    } else {
      methods.reset({
        title: "",
        content: "",
        video: "",
        presentation: "",
        document: "",
      });
    }
  }, [chapter, methods]);

  const onClose = () => {
    dispatch(closeChapterModal());
  };

  const onSubmit = (data: ChapterFormData) => {
    if (selectedSectionIndex === null) return;

    const newChapter: Chapter = {
      chapterId: chapter?.chapterId || uuidv4(),
      title: data.title,
      content: data.content,
      type: data.video ? "Video" : "Text",
      video: typeof data.video === "string" ? data.video : "",
      presentation:
        typeof data.presentation === "string" ? data.presentation : "",
      document: typeof data.document === "string" ? data.document : "",
    };

    const videoFile = data.video instanceof File ? data.video : null;
    const presentationFile =
      data.presentation instanceof File ? data.presentation : null;
    const documentFile = data.document instanceof File ? data.document : null;

    if (selectedChapterIndex === null) {
      dispatch(
        addChapter({
          sectionIndex: selectedSectionIndex,
          chapter: newChapter,
        })
      );
    } else {
      dispatch(
        editChapter({
          sectionIndex: selectedSectionIndex,
          chapterIndex: selectedChapterIndex,
          chapter: newChapter,
        })
      );
    }

    if (videoFile || presentationFile || documentFile) {
      if (window.chapterFiles === undefined) window.chapterFiles = {};
      window.chapterFiles[newChapter.chapterId] = {
        video: videoFile,
        presentation: presentationFile,
        document: documentFile,
      };
    }

    toast.success(`Bài học đã được thêm/cập nhật thành công`);
    onClose();
  };

  return (
    <CustomModal isOpen={isChapterModalOpen} onClose={onClose}>
      <div className="max-w-lg w-full mx-auto">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h2 className="text-xl font-semibold text-primary-800">
            {selectedChapterIndex === null ? "Thêm Bài học" : "Sửa Bài học"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <CustomFormField
              name="title"
              label="Tiêu đề bài học"
              placeholder="Tiêu đề bài học"
            />

            <CustomFormField
              name="content"
              label="Nội dung bài học"
              type="textarea"
              placeholder="Nội dung bài học"
            />

            <FormField
              control={methods.control}
              name="video"
              render={({ field: { onChange, value } }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-primary-600 text-sm flex items-center">
                    <Video className="w-4 h-4 mr-1.5" />
                    <span>Video bài học</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        className="border-none bg-customgreys-darkGrey py-2 cursor-pointer text-primary-100 w-full"
                      />
                      {typeof value === "string" && value && (
                        <div className="text-sm text-primary-500 bg-primary-50 p-2 rounded-md">
                          <p className="truncate">
                            Video hiện tại: {value.split("/").pop()}
                          </p>
                        </div>
                      )}
                      {value instanceof File && (
                        <div className="text-sm text-primary-500 bg-primary-50 p-2 rounded-md">
                          <p className="truncate">
                            Video đã chọn: {value.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={methods.control}
              name="presentation"
              render={({ field: { onChange, value } }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-primary-600 text-sm flex items-center">
                    <FileUp className="w-4 h-4 mr-1.5" />
                    <span>PowerPoint Presentation</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".ppt,.pptx,.pps,.ppsx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.presentationml.slideshow"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        className="border-none bg-customgreys-darkGrey py-2 cursor-pointer text-primary-100 w-full"
                      />
                      {typeof value === "string" && value && (
                        <div className="text-sm text-primary-500 bg-primary-50 p-2 rounded-md">
                          <p className="truncate">
                            Presentation hiện tại: {value.split("/").pop()}
                          </p>
                        </div>
                      )}
                      {value instanceof File && (
                        <div className="text-sm text-primary-500 bg-primary-50 p-2 rounded-md">
                          <p className="truncate">
                            Presentation đã chọn: {value.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            {/* 
            <FormField
              control={methods.control}
              name="document"
              render={({ field: { onChange, value } }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-primary-600 text-sm flex items-center">
                    <FileText className="w-4 h-4 mr-1.5" />
                    <span>Tài liệu Word</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        className="border-none bg-customgreys-darkGrey py-2 cursor-pointer text-primary-100 w-full"
                      />
                      {typeof value === "string" && value && (
                        <div className="text-sm text-primary-500 bg-primary-50 p-2 rounded-md">
                          <p className="truncate">
                            Tài liệu hiện tại: {value.split("/").pop()}
                          </p>
                        </div>
                      )}
                      {value instanceof File && (
                        <div className="text-sm text-primary-500 bg-primary-50 p-2 rounded-md">
                          <p className="truncate">
                            Tài liệu đã chọn: {value.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            /> */}

            <div className="flex flex-col xs:flex-row pt-4 gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full xs:w-auto"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                className="w-full xs:w-auto bg-primary-700 hover:bg-primary-600"
              >
                {selectedChapterIndex === null ? "Thêm" : "Cập nhật"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CustomModal>
  );
};

export default ChapterModal;
