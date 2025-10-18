// src/components/sidebar/app-sidebar.tsx
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
  Dessert,
  ReceiptText,          // ใช้เป็นไอคอน Orders/Receipts
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
import { useEffect, useState } from "react";
import useLogout from "@/hooks/uselogout";

// เมนูทั้งหมด
const items = [
  {
    title: "Home",
    path: "/Owner/home",
    showFor: ["Staff", "Owner"],
    icon: Home,
  },
  {
    title: "Menu",
    path: "/Owner/menu",
    showFor: ["Staff", "Owner"],
    icon: SquareMenu,
  },
  {
    title: "Category",
    path: "/Owner/category",
    showFor: ["Owner"],
    icon: ChartBarStacked,
  },
  {
    title: "Edit Menu",
    path: "/Owner/editmenu",
    showFor: ["Owner"],
    icon: SquarePen,
  },
  {
    title: "Orders",              // รายการออเดอร์ (ทุกสถานะ)
    path: "/Owner/orders",
    showFor: ["Staff", "Owner"],          // จะให้ Staff เห็นก็เพิ่ม "Staff"
    icon: ReceiptText,
  },
  {
    title: "Receipts",            // ⬅️ เมนูใหม่: ไปหน้าใบเสร็จ
    path: "/Owner/receipt",       // แนะนำทำหน้า index ที่ /Owner/receipt เป็นหน้าค้นหา/กรอกเลขบิล
    showFor: ["Owner"],           // จะเปิดให้ Staff ดูได้ก็เติม "Staff"
    icon: ReceiptText,
  },
  {
    title: "Sales Reports",
    path: "/Owner/sale",
    showFor: ["Owner"],
    icon: BadgeDollarSign,
  },
  {
    title: "Report",
    path: "/Owner/report",
    showFor: ["Owner"],
    icon: ChartBarStacked,
  },
  {
    title: "Employees",
    path: "/Owner/employee",
    showFor: ["Owner"],
    icon: IdCardLanyard,
  },
  {
    title: "Tax/Discount",
    path: "/Owner/tax_discount",
    showFor: ["Owner"],
    icon: TicketPercent,
  },
];

export function AppSidebar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { handleLogout } = useLogout();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/user");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        } else {
          console.error("Failed to fetch user role:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const filteredItems = userRole
    ? items.filter((item) => item.showFor.includes(userRole))
    : [];

  return (
    <Sidebar className="!bg-[#D3BBA1] drop-shadow-[0_4px_3px_rgba(0,0,0,0.5)] border-r border-[#D3BBA1]">
      <SidebarHeader className="bg-[#D3BBA1] p-4 flex justify-center items-center">
        <Dessert className="w-14 h-20 text-[#8B4513]" />
      </SidebarHeader>

      <SidebarContent className="bg-[#D3BBA1] text-[#835916]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-8">
              {isLoading ? (
                <div>Loading menu...</div>
              ) : userRole ? (
                filteredItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="!text-[#8B4513] hover:!bg-white hover:!text-[#8B4513] transition-all duration-200 !py-3 !px-4 rounded-lg mx-auto data-[state=open]:!bg-white data-[active=true]:!bg-white"
                    >
                      <a href={item.path} className="flex items-center gap-3">
                        <item.icon className="w-8 h-8 min-w-[1.5rem] min-h-[2rem]" />
                        <span className="text-lg">{item.title}</span>
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

      <SidebarFooter className="bg-[#D3BBA1]">
        <SidebarMenu>
          <SidebarMenuItem className="py-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="w-full">
                <SidebarMenuButton className="bg-[#D3BBA1] !text-[#8B4513] hover:!bg-white hover:!text-[#8B4513] transition-all duration-200 !py-5 !px-8 w-full">
                  <User2 className="w-6 h-6" />
                  <span className="ml-4 text-lg">
                    {isLoading ? "Loading..." : userRole || "Guest"}
                  </span>
                  <ChevronUp className="ml-auto w-5 h-5" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem className="!text-[#8B4513] hover:!bg-white hover:!text-[#8B4513] transition-all duration-200  !px-6 text-lg">
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="!text-[#8B4513] hover:!bg-white hover:!text-[#8B4513] transition-all duration-200  !px-6 text-lg"
                >
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
