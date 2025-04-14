declare global {
  interface UserSettings {
    theme?: "light" | "dark";
    emailAlerts?: boolean;
    smsAlerts?: boolean;
    courseNotifications?: boolean;
    notificationFrequency?: "immediate" | "daily" | "weekly";
  }

  interface User {
    userId: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email: string;
    publicMetadata: {
      userType: "teacher" | "student";
    };
    privateMetadata: {
      settings?: UserSettings;
      stripeCustomerId?: string;
    };
    unsafeMetadata: {
      bio?: string;
      urls?: string[];
    };
  }

  interface Course {
    courseId: string;
    teacherId: string;
    teacherName: string;
    title: string;
    description?: string;
    category?: string;
    image?: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    status: "Draft" | "Published";
    meetLink?: string;
    sections: Section[];
    enrollments?: Array<{
      userId: string;
    }>;
  }

  interface DateRange {
    from: string | undefined;
    to: string | undefined;
  }

  interface UserCourseProgress {
    userId: string;
    courseId: string;
    enrollmentDate: string;
    overallProgress: number;
    sections: SectionProgress[];
    lastAccessedTimestamp: string;
    completedChapters?: string[];
  }

  type CreateUserArgs = Omit<User, "userId">;
  type CreateCourseArgs = Omit<Course, "courseId">;

  interface CourseCardProps {
    course: Course;
    onGoToCourse: (course: Course) => void;
  }

  interface TeacherCourseCardProps {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (course: Course) => void;
    isOwner: boolean;
  }

  interface Comment {
    commentId: string;
    userId: string;
    text: string;
    timestamp: string;
  }

  interface Chapter {
    chapterId: string;
    title: string;
    content: string;
    video?: string | File;
    presentation?: string | File;
    freePreview?: boolean;
    type: "Text" | "Quiz" | "Video";
    resources?: Array<{ title: string; url: string }>;
  }

  interface ChapterProgress {
    chapterId: string;
    completed: boolean;
  }

  interface SectionProgress {
    sectionId: string;
    chapters: ChapterProgress[];
  }

  interface Section {
    sectionId: string;
    sectionTitle: string;
    sectionDescription?: string;
    chapters: Chapter[];
  }
  interface AccordionSectionsProps {
    sections: Section[];
  }

  interface SearchCourseCardProps {
    course: Course;
    isSelected?: boolean;
    onClick?: () => void;
  }

  interface CoursePreviewProps {
    course: Course;
  }

  interface CustomFixedModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
  }

  interface HeaderProps {
    title: string;
    subtitle: string;
    rightElement?: ReactNode;
  }

  interface SharedNotificationSettingsProps {
    title?: string;
    subtitle?: string;
  }

  interface SelectedCourseProps {
    course: Course;
    handleEnrollNow: (courseId: string) => void;
  }

  interface ToolbarProps {
    onSearch: (search: string) => void;
    onCategoryChange?: (category: string) => void;
  }

  interface ChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    chapterIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
    courseId: string;
  }

  interface SectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  }

  interface DroppableComponentProps {
    sections: Section[];
    setSections: (sections: Section[]) => void;
    handleEditSection: (index: number) => void;
    handleDeleteSection: (index: number) => void;
    handleAddChapter: (sectionIndex: number) => void;
    handleEditChapter: (sectionIndex: number, chapterIndex: number) => void;
    handleDeleteChapter: (sectionIndex: number, chapterIndex: number) => void;
  }

  interface CourseFormData {
    courseTitle: string;
    courseDescription: string;
    courseStatus: boolean;
  }

  interface Grade {
    gradeId: string;
    name: string;
    description?: string;
    level: number;
    courseIds: string[];
    createdAt?: string;
    updatedAt?: string;
  }

  interface GradeFormData {
    name: string;
    description: string;
    level: number;
  }

  // Add global window property for temporary file storage
  interface Window {
    chapterFiles?: {
      [chapterId: string]: {
        video: File | null;
        presentation: File | null;
      };
    };
  }
}

export {};
