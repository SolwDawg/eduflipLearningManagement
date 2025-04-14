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
    { icon: BarChart, label: "Tiến độ", href: "/user/progress" },
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
      className="h-full bg-customgreys-primarybg border-primary-200 shadow-lg"
    >
      <SidebarHeader>
        <SidebarMenu className="flex items-center justify-between p-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => toggleSidebar()}
              className="group hover:bg-customgreys-secondarybg p-2 w-full flex items-center"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <Image
                    src="/images/eduflipLogo.png"
                    alt="logo"
                    width={110}
                    height={10}
                    className="h-auto w-auto"
                  />
                </div>
                <PanelLeft className="h-5 w-5 text-gray-500" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        <SidebarMenu className="flex flex-col space-y-1 p-2">
          {studentNavLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <SidebarMenuItem
                key={link.href}
                className={cn(
                  "rounded-md overflow-hidden relative",
                  isActive && "bg-gray-100"
                )}
              >
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    "p-2 w-full flex items-center",
                    !isActive && "text-customgreys-dirtyGrey"
                  )}
                >
                  <Link
                    href={link.href}
                    className="flex items-center w-full"
                    scroll={false}
                  >
                    <link.icon
                      className={cn(
                        "h-5 w-5 mr-2",
                        isActive ? "text-primary-700" : "text-primary-500"
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium",
                        isActive ? "text-primary-700" : "text-primary-500"
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
                {isActive && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-primary-600" />
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="p-2 mt-auto">
          <SidebarMenuItem className="space-y-2">
            <SidebarMenuButton
              asChild
              className="w-full p-2 rounded-md hover:bg-gray-100"
            >
              <Link href="/" className="flex items-center">
                <Home className="h-5 w-5 mr-2 text-primary-500" />
                <span className="text-primary-500 font-medium">Trang chủ</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton
              asChild
              className="w-full p-2 rounded-md hover:bg-gray-100"
            >
              <button
                onClick={() => signOut()}
                className="flex items-center w-full"
              >
                <LogOut className="h-5 w-5 mr-2 text-primary-500" />
                <span className="text-primary-500 font-medium">Đăng xuất</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default StudentSidebar;
