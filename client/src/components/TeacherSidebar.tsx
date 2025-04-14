import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  Briefcase,
  Presentation,
  LogOut,
  PanelLeft,
  Settings,
  User,
  BarChart,
  Image as ImageIcon,
  MessageSquare,
  ListChecks,
  Users,
} from "lucide-react";
import Loading from "./Loading";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";

const TeacherSidebar = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const teacherNavLinks = [
    { icon: BookOpen, label: "Khoá học", href: "/teacher/courses" },
    {
      icon: BarChart,
      label: "Theo dõi khóa học",
      href: "/teacher/course-tracker",
    },
    { icon: Users, label: "Học sinh", href: "/teacher/students" },
    {
      icon: ListChecks,
      label: "Theo dõi đăng ký",
      href: "/teacher/students/enrollment-tracking",
    },
    { icon: Briefcase, label: "Lớp", href: "/teacher/grades" },
    { icon: User, label: "Hồ sơ", href: "/teacher/profile" },
    { icon: Settings, label: "Cài đặt", href: "/teacher/settings" },
    {
      icon: ImageIcon,
      label: "Hình ảnh trang chủ",
      href: "/teacher/homepage-images",
    },
    // { icon: MessageSquare, label: "Messages", href: "/teacher/messages" },
  ];

  if (!isLoaded) return <Loading />;
  if (!user) return <div>Không tìm thấy người dùng</div>;

  return (
    <Sidebar
      collapsible="icon"
      style={{ height: "100vh" }}
      className="bg-customgreys-primarybg border-primary-200 shadow-lg"
    >
      <SidebarHeader>
        <SidebarMenu className="app-sidebar__menu">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => toggleSidebar()}
              className="group hover:bg-customgreys-secondarybg"
            >
              <div className="app-sidebar__logo-container group">
                <div className="app-sidebar__logo-wrapper">
                  <Image
                    src="/images/eduflipLogo.png"
                    alt="logo"
                    width={110}
                    height={10}
                    className="app-sidebar__logo"
                  />
                </div>
                <PanelLeft className="app-sidebar__collapse-icon" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="app-sidebar__nav-menu">
          {teacherNavLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <SidebarMenuItem
                key={link.href}
                className={cn(
                  "app-sidebar__nav-item",
                  isActive && "bg-gray-800"
                )}
              >
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    "app-sidebar__nav-button",
                    !isActive && "text-customgreys-dirtyGrey"
                  )}
                >
                  <Link
                    href={link.href}
                    className="app-sidebar__nav-link"
                    scroll={false}
                  >
                    <link.icon
                      className={
                        isActive ? "text-primary-700" : "text-primary-500"
                      }
                    />
                    <span
                      className={`app-sidebar__nav-text ${
                        isActive ? "text-primary-700" : "text-primary-500"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
                {isActive && (
                  <div className="app-sidebar__active-indicator bg-primary-600" />
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={() => signOut()}
                className="app-sidebar__signout"
              >
                <LogOut className="mr-2 h-6 w-6" />
                <span>Đăng xuất</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default TeacherSidebar;
