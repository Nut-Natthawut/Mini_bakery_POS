import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";


export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <>
    <SidebarProvider className="h-screen bg-[#FFFDE4]">
      <AppSidebar/>
      <div className="min-h-screen">
        <div className="flex">
          {/* Sidebar */}
          

          {/* Main Content */}

          <main className="flex-1 p-6">
            <SidebarTrigger className="absolute top-4 z-10 w-10 hover:bg-white transition-all duration-200 [&_svg]:w-6 [&_svg]:h-6"/>
            {children}

          </main>
        </div>
      </div>
      </SidebarProvider>
    </>
  );
}