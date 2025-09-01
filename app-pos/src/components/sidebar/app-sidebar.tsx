"use client";

import {
  Home,
  SquareMenu,
  User2,
  ChevronUp,
  ChartBarStacked,
  SquarePen,
  BadgeDollarSign,
  IdCardLanyard,
  TicketPercent,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { useEffect, useState } from "react";

// Menu items.
const items = [
  {
    title: "Home",
    path: "/Owner/home",
    showFor: ['Staff', 'Owner'],
    icon: Home,
  },
  {
    title: "Menu",
    path: "/Owner/menu",
    showFor: ['Staff', 'Owner'],
    icon: SquareMenu,
  },
  {
    title: "Category",
    path: "/Owner/category",
    showFor: ['Owner'],
    icon: ChartBarStacked,
  },
  {
    title: "Edit Menu",
    path: "/Owner/editmenu",
    showFor: ['Owner'],
    icon: SquarePen,
  },
  {
    title: "Sales Reports",
    path: "/Owner/sale",
    showFor: ['Owner'],
    icon: BadgeDollarSign,
  },
  {
    title: "Employees",
    path: "/Owner/employee",
    showFor: ['Owner'],
    icon: IdCardLanyard,
  },
  {
    title: "Tax/Discount",
    path: "/Owner/tax_discount",
    showFor: ['Owner'],
    icon: TicketPercent,
  },
];


export function AppSidebar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ดึงข้อมูล role จาก API endpoint
    const fetchUserRole = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          console.log('User role from API:', data.role);
          setUserRole(data.role);
        } else {
          console.error('Failed to fetch user role:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  // กรองเมนูตาม role ของผู้ใช้
  const filteredItems = userRole 
    ? items.filter(item => item.showFor.includes(userRole))
    : [];

  return (
    <Sidebar>
      <SidebarHeader>Logo</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-8">
              {isLoading ? (
                <div>Loading menu...</div>
              ) : userRole ? (
                filteredItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a
                        href={item.path}
                        className="flex items-center gap-3" 
                      >
                        <item.icon className="w-7 h-7" />{" "}
                    
                        <span className="text-base">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div>No menu items available</div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />
                  <span className="ml-2">{isLoading ? 'Loading...' : userRole || 'Guest'}</span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/login">
                    <div>Sign out</div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
