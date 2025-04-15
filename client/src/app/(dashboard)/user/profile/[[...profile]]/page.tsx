"use client";

import Header from "@/components/Header";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useGetGradesQuery, useUpdateUserGradeMutation } from "@/state/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

const UserProfilePage = () => {
  const { userId } = useAuth();
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [initialGradeId, setInitialGradeId] = useState<string | null>(null);
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all available grades
  const {
    data: grades,
    isLoading: isGradesLoading,
    error: gradesError,
  } = useGetGradesQuery();

  // Update user grade mutation
  const [updateUserGrade, { isLoading: isUpdating }] =
    useUpdateUserGradeMutation();

  // Fetch current user metadata
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setUserMetadata(data);
        setSelectedGradeId(data.gradeId);
        setInitialGradeId(data.gradeId);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Không thể tải thông tin người dùng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Handle saving grade changes
  const handleSaveGrade = async () => {
    if (!userId) return;

    try {
      await updateUserGrade({
        userId,
        gradeId: selectedGradeId,
      }).unwrap();

      setInitialGradeId(selectedGradeId);
      toast.success("Cập nhật lớp thành công");
    } catch (error) {
      console.error("Error updating grade:", error);
      toast.error("Không thể cập nhật lớp");
    }
  };

  return (
    <div className="space-y-6">
      <Header title="Hồ sơ" subtitle="Xem và cập nhật hồ sơ của bạn" />

      {/* Grade Selection Card */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Lớp của tôi
          </CardTitle>
          <CardDescription>
            Chọn lớp của bạn để xem nội dung phù hợp và được phân loại theo lớp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || isGradesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedGradeId || ""}
              onValueChange={(value) => setSelectedGradeId(value || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn lớp của bạn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Không chọn lớp</SelectItem>
                {grades?.map((grade) => (
                  <SelectItem key={grade.gradeId} value={grade.gradeId}>
                    {grade.name} (Lớp {grade.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveGrade}
            disabled={
              isLoading || isUpdating || selectedGradeId === initialGradeId
            }
          >
            {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </CardFooter>
      </Card>

      {/* Clerk User Profile */}
      <UserProfile
        path="/user/profile"
        routing="path"
        appearance={{
          baseTheme: dark,
          elements: {
            navbar: {
              "& > div:nth-child(1)": {
                background: "none",
              },
            },
          },
        }}
      />
    </div>
  );
};

export default UserProfilePage;
