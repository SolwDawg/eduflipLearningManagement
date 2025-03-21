import { useUser } from "@clerk/nextjs";
import React from "react";
import Loading from "./Loading";
import TeacherSidebar from "./TeacherSidebar";
import StudentSidebar from "./StudentSidebar";

const AppSidebar = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <Loading />;
  if (!user) return <div>User not found</div>;

  // Check if user is a teacher based on publicMetadata
  const isTeacher = user.publicMetadata.userType === "teacher";

  if (isTeacher) {
    return <TeacherSidebar />;
  }

  // Default to student sidebar
  return <StudentSidebar />;
};

export default AppSidebar;
