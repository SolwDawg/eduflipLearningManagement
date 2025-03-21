import SharedNotificationSettings from "@/components/SharedNotificationSettings";
import React from "react";

const TeacherSettings = () => {
  return (
    <div className="w-3/5">
      <SharedNotificationSettings
        title="Cài đặt giáo viên"
        subtitle="Quản lý cài đặt thông báo giáo viên của bạn"
      />
    </div>
  );
};

export default TeacherSettings;
