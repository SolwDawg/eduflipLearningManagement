import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface Course {
  courseId: string;
  title: string;
  teacherId: string;
  teacherName: string;
}

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        setLoadingCourses(true);
        const response = await fetch(`/api/courses/enrolled/${user.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }

        const data = await response.json();
        setCourses(data.data || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try again.");
      } finally {
        setLoadingCourses(false);
      }
    };

    if (isOpen) {
      fetchCourses();
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedCourse || !message.trim()) return;

    const course = courses.find((c) => c.courseId === selectedCourse);
    if (!course) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: user.id,
          studentName: `${user.firstName} ${user.lastName}`,
          teacherId: course.teacherId,
          teacherName: course.teacherName,
          courseId: course.courseId,
          courseName: course.title,
          initialMessage: message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const data = await response.json();

      // Close the dialog and navigate to the new chat
      onClose();
      router.push(`/user/messages/${data.data.chatId}`);
    } catch (err) {
      console.error("Error creating chat:", err);
      setError("Failed to create chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Start a new conversation</DialogTitle>
            <DialogDescription>
              Choose a course and write a message to the teacher.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="course">Course</Label>
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
                disabled={loadingCourses || isLoading}
              >
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCourses ? (
                    <SelectItem value="loading" disabled>
                      Loading courses...
                    </SelectItem>
                  ) : courses.length > 0 ? (
                    courses.map((course) => (
                      <SelectItem key={course.courseId} value={course.courseId}>
                        {course.title} - {course.teacherName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      No courses available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message to the teacher..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
            </div>

            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedCourse || !message.trim() || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;
