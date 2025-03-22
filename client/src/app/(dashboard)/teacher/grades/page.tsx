"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetGradesQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";

const gradeFormSchema = z.object({
  name: z.string().min(1, "Grade name is required"),
  description: z.string().optional(),
  level: z.coerce.number().min(1, "Level must be at least 1"),
});

export default function GradesPage() {
  const router = useRouter();
  const { data: grades, isLoading, isError, refetch } = useGetGradesQuery();
  const [createGrade, { isLoading: isCreating }] = useCreateGradeMutation();
  const [updateGrade, { isLoading: isUpdating }] = useUpdateGradeMutation();
  const [deleteGrade, { isLoading: isDeleting }] = useDeleteGradeMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentGradeId, setCurrentGradeId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof gradeFormSchema>>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      level: 1,
    },
  });

  const handleOpenDialog = (grade?: Grade) => {
    if (grade) {
      setCurrentGradeId(grade.gradeId);
      form.reset({
        name: grade.name,
        description: grade.description || "",
        level: grade.level,
      });
    } else {
      setCurrentGradeId(null);
      form.reset({
        name: "",
        description: "",
        level: 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    form.reset();
  };

  const onSubmit = async (data: z.infer<typeof gradeFormSchema>) => {
    try {
      if (currentGradeId) {
        await updateGrade({
          gradeId: currentGradeId,
          gradeData: data,
        }).unwrap();
        toast.success("Lớp đã được cập nhật thành công");
      } else {
        await createGrade(data).unwrap();
        toast.success("Lớp đã được tạo thành công");
      }
      handleCloseDialog();
      refetch();
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Không thể lưu lớp");
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    try {
      await deleteGrade(gradeId).unwrap();
      toast.success("Lớp đã được xóa thành công");
      refetch();
    } catch (error) {
      console.error("Error deleting grade:", error);
      toast.error("Không thể xóa lớp");
    }
  };

  const handleViewCourses = (gradeId: string) => {
    router.push(`/teacher/grades/${gradeId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-red-500">Lỗi khi tải lớp</h2>
        <p>Có lỗi khi tải lớp. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý lớp</h1>
          <p className="text-muted-foreground">
            Quản lý lớp và khóa học liên quan
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Thêm lớp mới</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grades?.map((grade) => (
          <Card key={grade.gradeId} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{grade.name}</span>
                <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Lớp {grade.level}
                </span>
              </CardTitle>
              <CardDescription>
                {grade.description || "Không có mô tả"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                <span className="font-medium">Khóa học:</span>{" "}
                {grade.courseIds?.length || 0}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-2 gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleViewCourses(grade.gradeId)}
              >
                Xem khóa học
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(grade)}
                >
                  <Edit className="h-4 w-4" />
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
                      <AlertDialogTitle>Xóa lớp</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa lớp này? Hành động này không
                        thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground"
                        onClick={() => handleDeleteGrade(grade.gradeId)}
                      >
                        Xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        ))}

        {grades?.length === 0 && (
          <div className="col-span-full py-8 text-center">
            <p className="text-muted-foreground">
              Không có lớp nào. Tạo lớp mới để bắt đầu.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentGradeId ? "Chỉnh sửa lớp" : "Tạo lớp mới"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên lớp</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên lớp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Nhập mô tả lớp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cấp lớp</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Nhập cấp lớp"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Hủy bỏ
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {currentGradeId ? "Cập nhật" : "Tạo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
