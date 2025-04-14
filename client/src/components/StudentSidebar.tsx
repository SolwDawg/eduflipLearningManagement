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
  LogOut,
  PanelLeft,
  Settings,
  User,
  Home,
  BarChart,
  CalendarCheck,
  ChevronDown,
  GraduationCap,
  Grid,
  Library,
  ListChecks,
  PackageCheck,
  Settings2,
  Users,
  MessageSquare,
} from "lucide-react";
import Loading from "./Loading";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";

const StudentSidebar = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const studentNavLinks = [
    { icon: BookOpen, label: "Khoá học", href: "/user/courses" },
    { icon: BarChart, label: "Tiến độ", href: "/user/dashboard" },
    // { icon: MessageSquare, label: "Tin nhắn", href: "/student/messages" },
    { icon: User, label: "Hồ sơ", href: "/user/profile" },
    { icon: Settings, label: "Cài đặt", href: "/user/settings" },
  ];

  const navLinks = [
    {
      heading: "Dashboard",
      links: [
        { href: "/user", label: "Home", icon: Home },
        { href: "/user/explore", label: "Explore Courses", icon: Library },
        { href: "/user/enrolled", label: "My Courses", icon: GraduationCap },
        { href: "/user/schedule", label: "My Schedule", icon: CalendarCheck },
        { href: "/user/progress", label: "My Progress", icon: BarChart },
        { href: "/student/messages", label: "Messages", icon: MessageSquare },
      ],
    },
  ];

  if (!isLoaded) return <Loading />;
  if (!user) return <div>User not found</div>;

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
                  <div className="app-sidebar__logo-wrapper">
                    <Image
                      src="/images/eduflipLogo.png"
                      alt="logo"
                      width={110}
                      height={10}
                      className="app-sidebar__logo"
                    />
                  </div>
                </div>
                <PanelLeft className="app-sidebar__collapse-icon" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="app-sidebar__nav-menu">
          {studentNavLinks.map((link) => {
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
              <Link href="/" className="app-sidebar__signout">
                <span>Trang chủ</span>
              </Link>
            </SidebarMenuButton>
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

export default StudentSidebar;
