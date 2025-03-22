"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useGetGradeQuery,
  useGetGradeCoursesQuery,
  useAddCourseToGradeMutation,
  useRemoveCourseFromGradeMutation,
  useGetCoursesQuery,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ChevronLeft, PlusCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GradeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const gradeId = params.gradeId as string;

  const {
    data: grade,
    isLoading: isGradeLoading,
    isError: isGradeError,
  } = useGetGradeQuery(gradeId);
  const {
    data: courses,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
    refetch: refetchCourses,
  } = useGetGradeCoursesQuery(gradeId);

  const {
    data: allCourses,
    isLoading: isAllCoursesLoading,
    isError: isAllCoursesError,
  } = useGetCoursesQuery();
  const [addCourseToGrade, { isLoading: isAdding }] =
    useAddCourseToGradeMutation();
  const [removeCourseFromGrade, { isLoading: isRemoving }] =
    useRemoveCourseFromGradeMutation();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  useEffect(() => {
    if (isAddDialogOpen) {
      // Reset selected courses when dialog opens
      setSelectedCourses([]);
    }
  }, [isAddDialogOpen]);

  const handleGoBack = () => {
    router.push("/teacher/grades");
  };

  const handleAddCourses = async () => {
    if (selectedCourses.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khóa học");
      return;
    }

    try {
      // Add each selected course to the grade
      for (const courseId of selectedCourses) {
        await addCourseToGrade({ gradeId, courseId }).unwrap();
      }

      toast.success(`Đã thêm ${selectedCourses.length} khóa học vào lớp`);
      setIsAddDialogOpen(false);
      refetchCourses();
    } catch (error) {
      console.error("Error adding courses to grade:", error);
      toast.error("Không thể thêm khóa học vào lớp");
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    try {
      await removeCourseFromGrade({ gradeId, courseId }).unwrap();
      toast.success("Khóa học đã được xóa khỏi lớp");
      refetchCourses();
    } catch (error) {
      console.error("Error removing course from grade:", error);
      toast.error("Không thể xóa khóa học khỏi lớp");
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Filter out courses that are already in the grade
  const availableCourses = allCourses?.filter(
    (course) =>
      !courses?.some((gradeCourse) => gradeCourse.courseId === course.courseId)
  );

  if (isGradeLoading || isCoursesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isGradeError || !grade) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-red-500">Lỗi khi tải lớp</h2>
        <p>Lớp không được tìm thấy hoặc có lỗi khi tải nó.</p>
        <Button onClick={handleGoBack} className="mt-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Trở lại lớp
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-2">
        <Button variant="ghost" onClick={handleGoBack} className="mr-2">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Trở lại lớp
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{grade.name}</h1>
          <p className="text-muted-foreground">
            Lớp {grade.level} | {grade.description || "Không có mô tả"}
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Thêm khóa học</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isCoursesError ? (
          <div className="col-span-full py-8 text-center">
            <p className="text-red-500">
              Lỗi khi tải khóa học. Vui lòng thử lại.
            </p>
          </div>
        ) : courses?.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <p className="text-muted-foreground">
              Không có khóa học được gán cho lớp này.
            </p>
          </div>
        ) : (
          courses?.map((course) => (
            <Card key={course.courseId} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>{course.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground mb-2">
                  {course.description || "Không có mô tả"}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {course.level}
                  </span>
                  <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full">
                    {course.category}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex justify-between w-full items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/teacher/courses/${course.courseId}`)
                    }
                  >
                    Xem khóa học
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Course</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa khóa học này khỏi lớp? Hành
                          động này sẽ không xóa khóa học.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => handleRemoveCourse(course.courseId)}
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Dialog for adding courses to the grade */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm khóa học vào {grade.name}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {isAllCoursesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !availableCourses?.length ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Không có khóa học thêm.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableCourses.map((course) => (
                  <div
                    key={course.courseId}
                    className="flex items-start p-3 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => toggleCourseSelection(course.courseId)}
                  >
                    <Checkbox
                      id={`course-${course.courseId}`}
                      checked={selectedCourses.includes(course.courseId)}
                      onCheckedChange={() =>
                        toggleCourseSelection(course.courseId)
                      }
                      className="mt-1 mr-3"
                    />
                    <div>
                      <label
                        htmlFor={`course-${course.courseId}`}
                        className="font-medium cursor-pointer"
                      >
                        {course.title}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {course.description || "Không có mô tả"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                          {course.level}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                          {course.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={handleAddCourses}
              disabled={selectedCourses.length === 0 || isAdding}
            >
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Thêm {selectedCourses.length} khóa học
              {selectedCourses.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
