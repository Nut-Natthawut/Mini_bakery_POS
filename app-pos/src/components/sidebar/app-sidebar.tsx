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
    showFor: ['Staff', 'Owner'],
    icon: ChartBarStacked,
  },
  {
    title: "Edit Menu",
    path: "/Owner/editmenu",
    showFor: [, 'Owner'],
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
    path: "/Owner/employees",
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


export function AppSidebar({ userRole }: { userRole?: string }) {
  //   const filteredItems = items.filter(item => 
  //   item.showFor.includes(userRole || '')
  // );
    

  return (
    <Sidebar>
      <SidebarHeader>Logo</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-8">
              
              {items.map((item) => (
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
              ))}
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
                  <User2 />{userRole}
                  <span className="ml-2">{}</span>
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
