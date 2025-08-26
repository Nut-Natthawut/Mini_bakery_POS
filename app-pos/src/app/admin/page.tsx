import HomePage from "./home/page";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

export default function AdminPage() {
  return (
    <>
      <HomePage />
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      
    </>
  );
}
