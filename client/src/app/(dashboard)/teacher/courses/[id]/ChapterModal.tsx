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
import { FileUp, Video, X } from "lucide-react";
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
    },
  });

  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || "",
        presentation: chapter.presentation || "",
      });
    } else {
      methods.reset({
        title: "",
        content: "",
        video: "",
        presentation: "",
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
    };

    const videoFile = data.video instanceof File ? data.video : null;
    const presentationFile =
      data.presentation instanceof File ? data.presentation : null;

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

    if (videoFile || presentationFile) {
      if (window.chapterFiles === undefined) window.chapterFiles = {};
      window.chapterFiles[newChapter.chapterId] = {
        video: videoFile,
        presentation: presentationFile,
      };
    }

    toast.success(`Bài học đã được thêm/cập nhật thành công`);
    onClose();
  };

  return (
    <CustomModal isOpen={isChapterModalOpen} onClose={onClose}>
      <div className="chapter-modal">
        <div className="chapter-modal__header">
          <h2 className="chapter-modal__title">Thêm/Sửa Bài học</h2>
          <button onClick={onClose} className="chapter-modal__close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <Form {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="chapter-modal__form"
          >
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
                <FormItem>
                  <FormLabel className="text-primary-600 text-sm">
                    <Video className="w-4 h-4 inline mr-1" /> Video bài học
                  </FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        className="border-none bg-customgreys-darkGrey py-2 cursor-pointer text-primary-100"
                      />
                      {typeof value === "string" && value && (
                        <div className="my-2 text-sm text-primary-500">
                          Video hiện tại: {value.split("/").pop()}
                        </div>
                      )}
                      {value instanceof File && (
                        <div className="my-2 text-sm text-primary-500">
                          Video đã chọn: {value.name}
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
                <FormItem>
                  <FormLabel className="text-primary-600 text-sm">
                    <FileUp className="w-4 h-4 inline mr-1" /> PowerPoint
                    Presentation
                  </FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept=".ppt,.pptx,.pps,.ppsx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.presentationml.slideshow"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        className="border-none bg-customgreys-darkGrey py-2 cursor-pointer text-primary-100"
                      />
                      <div className="text-xs text-primary-400 mt-1">
                        Supported formats: .ppt, .pptx, .pps, .ppsx
                      </div>
                      {typeof value === "string" && value && (
                        <div className="my-2 text-sm text-primary-500">
                          Current presentation: {value.split("/").pop()}
                        </div>
                      )}
                      {value instanceof File && (
                        <div className="my-2 text-sm text-primary-500">
                          Selected presentation: {value.name} (
                          {(value.size / (1024 * 1024)).toFixed(2)} MB)
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="chapter-modal__actions">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-primary-600 hover:text-primary-700"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                className="bg-primary-700 text-primary-50 hover:text-primary-100"
              >
                Lưu
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CustomModal>
  );
};

export default ChapterModal;
