import SharedNotificationSettings from "@/components/SharedNotificationSettings";
import React from "react";

const UserSettings = () => {
  return (
    <div className="w-3/5">
      <SharedNotificationSettings
        title="Cài đặt tài khoản"
        subtitle="Quản lý cài đặt thông báo tài khoản của bạn"
      />
    </div>
  );
};

export default UserSettings;
