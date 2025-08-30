import HomePage from "./home/page";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

export default function OwnerPage() {
  return (
    <>
      <HomePage />
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      
    </>
  );
}
