import Header from "@/components/Header";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import React from "react";

const TeacherProfilePage = () => {
  return (
    <>
      <Header title="Hồ sơ" subtitle="Xem hồ sơ của bạn" />
      <UserProfile
        path="/teacher/profile"
        routing="path"
        appearance={{
          baseTheme: dark,
          elements: {
            scrollBox: "bg-customgreys-darkGrey",
            navbar: {
              "& > div:nth-child(1)": {
                background: "none",
              },
            },
          },
        }}
      />
    </>
  );
};

export default TeacherProfilePage;
