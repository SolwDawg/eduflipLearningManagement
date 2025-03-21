"use client";

import {
  NotificationSettingsFormData,
  notificationSettingsSchema,
} from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateUserMutation } from "@/state/api";
import { useUser } from "@clerk/nextjs";
import React from "react";
import { useForm } from "react-hook-form";
import Header from "./Header";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "./CustomFormField";
import { Button } from "@/components/ui/button";

const SharedNotificationSettings = ({
  title = "Cài đặt thông báo",
  subtitle = "Quản lý cài đặt thông báo của bạn",
}: SharedNotificationSettingsProps) => {
  const { user } = useUser();
  const [updateUser] = useUpdateUserMutation();

  const currentSettings =
    (user?.publicMetadata as { settings?: UserSettings })?.settings || {};

  const methods = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      courseNotifications: currentSettings.courseNotifications || false,
      emailAlerts: currentSettings.emailAlerts || false,
      smsAlerts: currentSettings.smsAlerts || false,
      notificationFrequency: currentSettings.notificationFrequency || "daily",
    },
  });

  const onSubmit = async (data: NotificationSettingsFormData) => {
    if (!user) return;

    const updatedUser = {
      userId: user.id,
      publicMetadata: {
        ...user.publicMetadata,
        settings: {
          ...currentSettings,
          ...data,
        },
      },
    };

    try {
      await updateUser(updatedUser);
    } catch (error) {
      console.error("Failed to update user settings: ", error);
    }
  };

  if (!user) return <div>Vui lòng đăng nhập để quản lý cài đặt của bạn.</div>;

  return (
    <div className="notification-settings">
      <Header title={title} subtitle={subtitle} />
      <Form {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="notification-settings__form"
        >
          <div className="notification-settings__fields">
            <CustomFormField
              name="courseNotifications"
              label="Thông báo khóa học"
              type="switch"
            />
            <CustomFormField
              name="emailAlerts"
              label="Thông báo email"
              type="switch"
            />
            <CustomFormField
              name="smsAlerts"
              label="Thông báo SMS"
              type="switch"
            />

            <CustomFormField
              name="notificationFrequency"
              label="Tần suất thông báo"
              type="select"
              options={[
                { value: "immediate", label: "Ngay lập tức" },
                { value: "daily", label: "Hàng ngày" },
                { value: "weekly", label: "Hàng tuần" },
              ]}
            />
          </div>

          <Button type="submit" className="notification-settings__submit">
            Cập nhật cài đặt
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SharedNotificationSettings;
